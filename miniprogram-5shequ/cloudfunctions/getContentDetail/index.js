// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('=== getContentDetail 云函数开始 ===');
  console.log('接收到的参数:', JSON.stringify(event, null, 2));
  
  const { contentId, userId } = event;
  
  if (!contentId) {
    console.error('❌ contentId 不能为空');
    return { code: -1, msg: 'contentId 不能为空' };
  }
  
  console.log('准备查询内容ID:', contentId);
  
  // 先检查数据库中是否有数据
  try {
    console.log('检查 content_cards 集合状态...');
    const collectionInfo = await db.collection('content_cards').count();
    console.log('content_cards 集合统计:', collectionInfo);
    
    if (collectionInfo.total === 0) {
      console.warn('⚠️ content_cards 集合为空，没有数据');
      return { 
        code: -1, 
        msg: '数据库中暂无内容数据',
        debug: { collectionTotal: 0 }
      };
    }
    
    // 获取几条示例数据用于调试
    const sampleData = await db.collection('content_cards').limit(3).get();
    console.log('示例数据:', JSON.stringify(sampleData.data, null, 2));
    
  } catch (checkError) {
    console.error('❌ 检查数据库状态失败:', checkError);
  }
  
  try {
    // 查询内容详情
    console.log('开始查询 content_cards 集合...');
    const contentRes = await db.collection('content_cards').doc(contentId).get();
    console.log('content_cards 查询结果:', JSON.stringify(contentRes, null, 2));
    
    const content = contentRes.data;
    if (!content) {
      console.error('❌ 内容不存在，ID:', contentId);
      return { code: -1, msg: '内容不存在' };
    }
    
    console.log('✅ 内容查询成功:', content._id);
    
    // 查询作者信息
    console.log('开始查询作者信息，authorId:', content.authorId);
    let author = {};
    try {
      const authorRes = await db.collection('users').doc(content.authorId).get();
      author = authorRes.data || {};
      console.log('作者信息查询结果:', JSON.stringify(author, null, 2));
    } catch (authorError) {
      console.warn('⚠️ 作者信息查询失败:', authorError.message);
      // 作者信息查询失败不影响主流程
    }
    
    // 查询当前用户是否已点赞/收藏/关注
    let isLiked = false, isFavorited = false, isFollowed = false;
    
    if (userId) {
      console.log('开始查询用户互动状态，userId:', userId);
      try {
        const [likeCount, favoriteCount, followCount] = await Promise.all([
          db.collection('likes').where({ userId, contentId }).count(),
          db.collection('favorites').where({ userId, contentId }).count(),
          db.collection('user_follow').where({ userId, followId: content.authorId }).count()
        ]);
        
        isLiked = likeCount.total > 0;
        isFavorited = favoriteCount.total > 0;
        isFollowed = followCount.total > 0;
        
        console.log('用户互动状态:', { isLiked, isFavorited, isFollowed });
      } catch (interactionError) {
        console.warn('⚠️ 用户互动状态查询失败:', interactionError.message);
        // 互动状态查询失败不影响主流程
      }
    }
    
    const result = {
      code: 0,
      data: {
        ...content,
        author: {
          _id: author._id,
          nickname: author.nickname || '未知用户',
          avatar: author.avatar || '',
          isFollowed
        },
        isLiked,
        isFavorited
      }
    };
    
    console.log('✅ 返回结果:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('❌ getContentDetail 执行失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      contentId: contentId
    });
    
    // 根据错误类型返回不同的错误信息
    if (error.message && error.message.includes('document with _id')) {
      return { 
        code: -1, 
        msg: '内容不存在或已被删除',
        error: error.message 
      };
    }
    
    return { 
      code: -1, 
      msg: '获取内容详情失败',
      error: error.message 
    };
  }
}; 