const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 内容安全检测
async function checkContent(content) {
  try {
    const res = await cloud.openapi.security.msgSecCheck({ content })
    console.log('[checkContent] content:', content, 'res:', res);
    return { safe: res && res.result && res.result.suggest === 'pass', raw: res }
  } catch (e) {
    console.error('[checkContent] error:', e, 'content:', content);
    return { safe: false, err: e }
  }
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const now = new Date();

  switch (action) {
    case 'addComment': {
      // 支持评论和回复
      const { content, contentId, replyTo = '' } = event;
      const userId = wxContext.OPENID;
      // 查询用户信息，若不存在则自动创建
      let userRes = await db.collection('users').where({ _id: userId }).get();
      if (!userRes.data || userRes.data.length === 0) {
        await db.collection('users').doc(userId).set({
          data: {
            nickName: '匿名用户',
            isAdmin: false,
            createdAt: now
          }
        });
        userRes = { data: [{ nickName: '匿名用户', isAdmin: false }] };
      }
      const userName = userRes.data[0].nickName || '用户';
      const isAdmin = userRes.data[0].isAdmin || false;
      // 日志：记录提交参数
      console.log('[addComment] content:', content, 'contentId:', contentId, 'replyTo:', replyTo, 'userId:', userId, 'userName:', userName, 'isAdmin:', isAdmin);
      // 写入评论
      const comment = {
        contentId,
        content,
        userId,
        userName,
        isAdmin,
        replyTo,
        likeCount: 0,
        createdAt: now,
        deleted: false
      };
      console.log('[addComment] final comment:', comment);
      const addRes = await db.collection('comments').add({ data: comment });
      return { code: 0, msg: '评论成功', _id: addRes._id };
    }
    case 'getComments': {
      // 分页获取评论，支持热评置顶、楼主/管理员标识、楼中楼结构
      const { contentId, page = 1, pageSize = 10 } = event;
      // 获取内容详情，查找楼主id
      const contentRes = await db.collection('content_cards').doc(contentId).get();
      const authorId = contentRes.data.authorId;
      // 热评（likeCount>3，按点赞数降序，最多3条）
      const hotRes = await db.collection('comments')
        .where({ contentId, deleted: false, likeCount: _.gt(3), replyTo: '' })
        .orderBy('likeCount', 'desc').limit(3).get();
      // 普通评论（按时间倒序，分页）
      const total = (await db.collection('comments').where({ contentId, deleted: false, replyTo: '' }).count()).total;
      const commentRes = await db.collection('comments')
        .where({ contentId, deleted: false, replyTo: '' })
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize).limit(pageSize).get();
      // 查所有回复
      const allIds = [...hotRes.data, ...commentRes.data].map(c => c._id);
      let replies = [];
      if (allIds.length) {
        const replyRes = await db.collection('comments')
          .where({ contentId, deleted: false, replyTo: _.in(allIds) })
          .orderBy('createdAt', 'asc').get();
        replies = replyRes.data;
      }
      // 合并楼主/管理员标识、楼中楼
      function decorate(list) {
        return list.map(c => {
          const isAuthor = c.userId === authorId;
          return {
            ...c,
            isAuthor,
            isAdmin: !!c.isAdmin,
            canDelete: c.userId === wxContext.OPENID || !!c.isAdmin,
            replies: replies.filter(r => r.replyTo === c._id).map(r => ({
              ...r,
              isAuthor: r.userId === authorId,
              isAdmin: !!r.isAdmin,
              canDelete: r.userId === wxContext.OPENID || !!r.isAdmin
            }))
          }
        })
      }
      return {
        code: 0,
        hotComments: decorate(hotRes.data),
        comments: decorate(commentRes.data),
        total
      }
    }
    case 'likeComment': {
      // 点赞/取消点赞
      const { commentId } = event;
      const userId = wxContext.OPENID;
      // 点赞集合：comment_likes
      const likeCol = db.collection('comment_likes');
      const likeRes = await likeCol.where({ commentId, userId }).get();
      if (likeRes.data.length) {
        // 已点赞，取消
        await likeCol.where({ commentId, userId }).remove();
        await db.collection('comments').doc(commentId).update({ data: { likeCount: _.inc(-1) } });
        return { code: 0, liked: false };
      } else {
        // 未点赞，点赞
        await likeCol.add({ data: { commentId, userId, createdAt: now } });
        await db.collection('comments').doc(commentId).update({ data: { likeCount: _.inc(1) } });
        return { code: 0, liked: true };
      }
    }
    case 'deleteComment':
    case 'removeComment': {
      // 删除评论（软删）
      const { commentId } = event;
      const userId = wxContext.OPENID;
      // 仅本人或管理员可删
      const comment = await db.collection('comments').doc(commentId).get();
      if (comment.data.userId !== userId && !comment.data.isAdmin) {
        return { code: -1, msg: '无权限' };
      }
      await db.collection('comments').doc(commentId).update({ data: { deleted: true } });
      return { code: 0, msg: '删除成功' };
    }
    case 'checkContent': {
      // 内容安全检测
      const { content } = event;
      return await checkContent(content);
    }
    default:
      return { code: -1, msg: '未知操作' };
  }
} 