/**
 * @file cloudfunctions/content/index.js
 * @description 内容发布/草稿相关云函数，处理内容的发布、草稿保存等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - publish: 发布内容
 * - draft: 保存/更新草稿
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'content', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、内容参数等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID } = cloud.getWXContext();
  
  // 添加详细日志
  console.log('=== 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  
  switch(event.type) {
    case 'publish': {
      /**
       * 发布内容
       * @param {Array} images - 图片 fileID 列表
       * @param {string} title - 标题
       * @param {string} desc - 描述
       * @param {Array} tags - 标签
       * @param {Object} location - 定位信息
       * @returns {Object} { _id }
       */
      // 发布内容，插入一条 status=published
      const { images = [], title = '', desc = '', tags = [], location = null } = event
      
      // 详细参数日志
      console.log('=== publish 参数解析 ===');
      console.log('images:', images);
      console.log('title:', title);
      console.log('desc:', desc);
      console.log('tags:', tags);
      console.log('location:', location);
      console.log('desc 类型:', typeof desc);
      console.log('desc 长度:', desc ? desc.length : 0);
      
      if (!desc) {
        console.log('❌ 缺少必填参数 desc');
        return { code: -1, msg: '缺少必填参数' }
      }
      
      console.log('✅ 参数校验通过');
      
      const doc = {
        images,
        title,
        desc,
        tags,
        location,
        authorId: OPENID,
        status: 'published',
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        isFollowed: false
      }
      
      console.log('准备插入数据:', JSON.stringify(doc, null, 2));
      
      try {
        const res = await db.collection('content_cards').add({ data: doc })
        console.log('✅ 数据插入成功:', res._id);
        return { code: 0, msg: 'success', data: { _id: res._id } }
      } catch (error) {
        console.error('❌ 数据插入失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '数据插入失败', error: error.message }
      }
    }
    case 'draft': {
      /**
       * 保存/更新草稿
       * @param {string} draftId - 草稿ID（有则更新，无则新建）
       * @param {Array} images - 图片 fileID 列表
       * @param {string} title - 标题
       * @param {string} desc - 描述
       * @param {Array} tags - 标签
       * @param {Object} location - 定位信息
       * @returns {Object} { _id }
       */
      // 保存草稿，插入或更新 status=draft
      const { draftId, images = [], title = '', desc = '', tags = [], location = null } = event
      
      console.log('=== draft 参数解析 ===');
      console.log('draftId:', draftId);
      console.log('images:', images);
      console.log('title:', title);
      console.log('desc:', desc);
      console.log('tags:', tags);
      console.log('location:', location);
      
      const doc = {
        images,
        title,
        desc,
        tags,
        location,
        authorId: OPENID,
        status: 'draft',
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        isFollowed: false
      }
      
      let _id = draftId
      try {
        if (draftId) {
          await db.collection('content_cards').doc(draftId).update({ data: doc })
          console.log('✅ 草稿更新成功:', draftId);
        } else {
          const res = await db.collection('content_cards').add({ data: doc })
          _id = res._id
          console.log('✅ 草稿创建成功:', _id);
        }
        return { code: 0, msg: 'success', data: { _id } }
      } catch (error) {
        console.error('❌ 草稿操作失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '草稿操作失败', error: error.message }
      }
    }
    case 'initTestData': {
      /**
       * 初始化测试数据
       * 仅供开发测试使用
       */
      console.log('=== initTestData 开始处理 ===');
      
      const { OPENID } = cloud.getWXContext();
      
      // 测试数据
      const testData = [
        {
          images: ['/static/home/card0.png'],
          title: '少年,星空与梦想',
          desc: '这是一段关于少年、星空与梦想的美好描述，充满了对未来的憧憬和对美好生活的向往。',
          tags: ['AI绘画', '版权素材'],
          authorId: OPENID,
          status: 'published',
          createdAt: new Date(),
          likeCount: 128,
          commentCount: 32,
          favoriteCount: 15,
          viewCount: 1024
        },
        {
          images: ['/static/home/card1.png'],
          title: '仰望星空的少女',
          desc: '少女仰望星空的瞬间，捕捉到了内心最纯净的感动，这一刻仿佛时间静止。',
          tags: ['AI绘画', '版权素材'],
          authorId: OPENID,
          status: 'published',
          createdAt: new Date(),
          likeCount: 256,
          commentCount: 48,
          favoriteCount: 28,
          viewCount: 2048
        },
        {
          images: ['/static/home/card2.png'],
          title: '仰望星空的少年',
          desc: '少年在星空下的沉思，展现了青春期的思考和对宇宙奥秘的探索精神。',
          tags: ['AI绘画', '版权素材'],
          authorId: OPENID,
          status: 'published',
          createdAt: new Date(),
          likeCount: 89,
          commentCount: 16,
          favoriteCount: 12,
          viewCount: 768
        },
        {
          images: ['/static/home/card3.png'],
          title: '少年,星空与梦想',
          desc: '另一个关于少年、星空与梦想的故事，每个少年心中都有一片属于自己的星空。',
          tags: ['AI绘画', '版权素材'],
          authorId: OPENID,
          status: 'published',
          createdAt: new Date(),
          likeCount: 167,
          commentCount: 24,
          favoriteCount: 19,
          viewCount: 1536
        },
        {
          images: ['/static/home/card4.png'],
          title: '多彩的天空',
          desc: '天空中的多彩云彩，展现了自然界的美丽和神奇，让人感受到大自然的力量。',
          tags: ['AI绘画', '版权素材'],
          authorId: OPENID,
          status: 'published',
          createdAt: new Date(),
          likeCount: 203,
          commentCount: 35,
          favoriteCount: 22,
          viewCount: 1792
        }
      ];
      
      console.log('准备插入的测试数据:', JSON.stringify(testData, null, 2));
      
      try {
        // 先清空现有数据（可选）
        // await db.collection('content_cards').where({}).remove();
        // console.log('已清空现有内容数据');
        
        // 插入新数据
        const insertPromises = testData.map(item => 
          db.collection('content_cards').add({ data: item })
        );
        
        const insertResults = await Promise.all(insertPromises);
        console.log('测试数据插入结果:', insertResults);
        
        const result = { 
          code: 0, 
          msg: '测试数据插入成功',
          data: { 
            insertedCount: insertResults.length,
            insertedIds: insertResults.map(res => res._id)
          }
        };
        
        console.log('=== initTestData 返回结果 ===');
        console.log('返回数据:', JSON.stringify(result, null, 2));
        
        return result;
      } catch (error) {
        console.error('测试数据插入失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '测试数据插入失败', error: error.message };
      }
    }
    default:
      console.log('❌ 未知的 type:', event.type);
      console.log('未知 type 事件详情:', JSON.stringify(event, null, 2));
      return { code: -1, msg: 'unknown type' }
  }
} 