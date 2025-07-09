/**
 * @file cloudfunctions/search/index.js
 * @description 搜索相关云函数，处理搜索历史、热门、内容搜索等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - getHistory: 获取搜索历史
 * - addHistory: 添加搜索历史
 * - deleteHistory: 删除搜索历史
 * - getPopular: 获取热门搜索
 * - searchContent: 内容搜索
 * - initPopularSearch: 初始化热门搜索
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'search', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、搜索参数等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID } = cloud.getWXContext();
  
  console.log('=== search 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  
  switch(event.type) {
    case 'getHistory': {
      /**
       * 获取搜索历史
       * @returns {Array} 搜索历史列表
       */
      console.log('=== getHistory 开始处理 ===');
      try {
        const result = await db.collection('search_history')
          .where({ userId: OPENID })
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();
        
        console.log('✅ 搜索历史获取成功，数量:', result.data.length);
        return { code: 0, msg: 'success', data: result.data };
      } catch (error) {
        console.error('❌ 获取搜索历史失败:', error);
        return { code: -1, msg: '获取搜索历史失败', error: error.message };
      }
    }
    
    case 'addHistory': {
      /**
       * 添加搜索历史
       * @param {string} keyword - 搜索关键词
       * @returns {Object} 操作结果
       */
      console.log('=== addHistory 开始处理 ===');
      const { keyword } = event;
      
      if (!keyword || !keyword.trim()) {
        console.log('❌ 搜索关键词不能为空');
        return { code: -1, msg: '搜索关键词不能为空' };
      }
      
      try {
        // 检查是否已存在相同关键词
        const existHistory = await db.collection('search_history')
          .where({
            userId: OPENID,
            keyword: keyword.trim()
          })
          .get();
        
        if (existHistory.data && existHistory.data.length > 0) {
          // 更新搜索时间
          await db.collection('search_history')
            .doc(existHistory.data[0]._id)
            .update({
              data: { updatedAt: new Date() }
            });
          console.log('✅ 搜索历史更新时间成功');
        } else {
          // 添加新的搜索历史
          await db.collection('search_history').add({
            data: {
              userId: OPENID,
              keyword: keyword.trim(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log('✅ 搜索历史添加成功');
        }
        
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 添加搜索历史失败:', error);
        return { code: -1, msg: '添加搜索历史失败', error: error.message };
      }
    }
    
    case 'deleteHistory': {
      /**
       * 删除搜索历史
       * @param {string} keyword - 搜索关键词（可选）
       * @returns {Object} 操作结果
       */
      console.log('=== deleteHistory 开始处理 ===');
      const { keyword } = event;
      
      try {
        if (keyword) {
          // 删除指定关键词
          await db.collection('search_history')
            .where({
              userId: OPENID,
              keyword: keyword
            })
            .remove();
          console.log('✅ 删除指定搜索历史成功');
        } else {
          // 删除所有搜索历史
          await db.collection('search_history')
            .where({ userId: OPENID })
            .remove();
          console.log('✅ 删除所有搜索历史成功');
        }
        
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 删除搜索历史失败:', error);
        return { code: -1, msg: '删除搜索历史失败', error: error.message };
      }
    }
    
    case 'getPopular': {
      /**
       * 获取热门搜索关键词
       * @returns {Array} 热门关键词列表
       */
      console.log('=== getPopular 开始处理 ===');
      try {
        // 获取热门搜索关键词
        const result = await db.collection('search_popular')
          .orderBy('count', 'desc')
          .limit(10)
          .get();
        
        console.log('✅ 热门搜索获取成功，数量:', result.data.length);
        return { code: 0, msg: 'success', data: result.data };
      } catch (error) {
        console.error('❌ 获取热门搜索失败:', error);
        return { code: -1, msg: '获取热门搜索失败', error: error.message };
      }
    }
    
    case 'searchContent': {
      /**
       * 内容搜索
       * @param {string} keyword - 搜索关键词
       * @param {number} page - 页码
       * @param {number} pageSize - 每页条数
       * @returns {Object} { list, page, pageSize, total, keyword }
       */
      console.log('=== searchContent 开始处理 ===');
      const { keyword, page = 1, pageSize = 20 } = event;
      
      if (!keyword || !keyword.trim()) {
        console.log('❌ 搜索关键词不能为空');
        return { code: -1, msg: '搜索关键词不能为空' };
      }
      
      try {
        // 构建搜索条件
        const searchKeyword = keyword.trim();
        const query = {
          status: 'published',
          $or: [
            { title: db.RegExp({ regexp: searchKeyword, options: 'i' }) },
            { desc: db.RegExp({ regexp: searchKeyword, options: 'i' }) },
            { tags: db.RegExp({ regexp: searchKeyword, options: 'i' }) }
          ]
        };
        
        const result = await db.collection('content_cards')
          .where(query)
          .orderBy('createdAt', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        console.log('✅ 内容搜索成功，数量:', result.data.length);
        
        // 添加搜索历史
        try {
          await db.collection('search_history').add({
            data: {
              userId: OPENID,
              keyword: searchKeyword,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        } catch (historyError) {
          console.warn('⚠️ 添加搜索历史失败:', historyError);
        }
        
        return { 
          code: 0, 
          msg: 'success', 
          data: {
            list: result.data,
            page,
            pageSize,
            total: result.data.length,
            keyword: searchKeyword
          }
        };
      } catch (error) {
        console.error('❌ 内容搜索失败:', error);
        return { code: -1, msg: '内容搜索失败', error: error.message };
      }
    }
    
    case 'initPopularSearch': {
      /**
       * 初始化热门搜索数据
       */
      console.log('=== initPopularSearch 开始处理 ===');
      try {
        // 初始化热门搜索数据
        const popularKeywords = [
          { keyword: 'AI绘画', count: 150 },
          { keyword: 'Stable Diffusion', count: 120 },
          { keyword: '版权素材', count: 100 },
          { keyword: '星空', count: 80 },
          { keyword: 'illustration', count: 75 },
          { keyword: '原创', count: 70 },
          { keyword: '插画', count: 65 },
          { keyword: '设计', count: 60 },
          { keyword: '艺术', count: 55 },
          { keyword: '创意', count: 50 }
        ];
        
        // 清空现有数据
        await db.collection('search_popular').where({}).remove();
        
        // 插入新数据
        for (const item of popularKeywords) {
          await db.collection('search_popular').add({
            data: {
              ...item,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        console.log('✅ 热门搜索初始化成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 热门搜索初始化失败:', error);
        return { code: -1, msg: '热门搜索初始化失败', error: error.message };
      }
    }
    
    default:
      console.log('❌ 未知的 type:', event.type);
      return { code: -1, msg: 'unknown type' };
  }
}; 