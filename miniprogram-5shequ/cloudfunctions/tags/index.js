/**
 * @file cloudfunctions/tags/index.js
 * @description 标签相关云函数，处理标签获取、添加、更新、删除等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - getTags: 获取标签
 * - getPopularTags: 获取热门标签
 * - addTag: 添加标签
 * - updateTag: 更新标签
 * - deleteTag: 删除标签
 * - searchTags: 搜索标签
 * - initTags: 初始化标签
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'tags', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、标签参数等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID } = cloud.getWXContext();
  
  console.log('=== tags 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  
  switch(event.type) {
    case 'getTags': {
      /**
       * 获取标签列表
       * @param {string} type - 标签类型
       * @param {number} limit - 数量限制
       * @returns {Array} 标签列表
       */
      console.log('=== getTags 开始处理 ===');
      const { type = 'all', limit = 50 } = event;
      
      try {
        let query = {};
        
        // 根据类型筛选
        if (type !== 'all') {
          query.type = type;
        }
        
        const result = await db.collection('tags')
          .where(query)
          .orderBy('count', 'desc')
          .limit(limit)
          .get();
        
        console.log('✅ 标签获取成功，数量:', result.data.length);
        return { code: 0, msg: 'success', data: result.data };
      } catch (error) {
        console.error('❌ 获取标签失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取标签失败', error: error.message };
      }
    }
    
    case 'getPopularTags': {
      /**
       * 获取热门标签
       * @param {number} limit - 数量限制
       * @returns {Array} 标签列表
       */
      console.log('=== getPopularTags 开始处理 ===');
      const { limit = 20 } = event;
      
      try {
        const result = await db.collection('tags')
          .orderBy('count', 'desc')
          .limit(limit)
          .get();
        
        console.log('✅ 热门标签获取成功，数量:', result.data.length);
        return { code: 0, msg: 'success', data: result.data };
      } catch (error) {
        console.error('❌ 获取热门标签失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取热门标签失败', error: error.message };
      }
    }
    
    case 'addTag': {
      /**
       * 添加标签
       * @param {string} name - 标签名
       * @param {string} type - 标签类型
       * @param {string} color - 标签颜色
       * @returns {Object} 操作结果
       */
      console.log('=== addTag 开始处理 ===');
      const { name, type = 'general', color = 'primary' } = event;
      
      if (!name || !name.trim()) {
        console.log('❌ 标签名称不能为空');
        return { code: -1, msg: '标签名称不能为空' };
      }
      
      try {
        // 检查标签是否已存在
        const existTag = await db.collection('tags')
          .where({
            name: name.trim()
          })
          .get();
        
        if (existTag.data && existTag.data.length > 0) {
          // 标签已存在，增加使用次数
          const tag = existTag.data[0];
          await db.collection('tags')
            .doc(tag._id)
            .update({
              data: { 
                count: tag.count + 1,
                updatedAt: new Date()
              }
            });
          
          console.log('✅ 标签使用次数增加成功');
          return { code: 0, msg: 'success', data: { _id: tag._id } };
        } else {
          // 创建新标签
          const newTag = {
            name: name.trim(),
            type: type,
            color: color,
            count: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result = await db.collection('tags').add({ data: newTag });
          console.log('✅ 新标签创建成功:', result._id);
          
          return { code: 0, msg: 'success', data: { _id: result._id } };
        }
      } catch (error) {
        console.error('❌ 添加标签失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '添加标签失败', error: error.message };
      }
    }
    
    case 'updateTag': {
      /**
       * 更新标签
       * @param {string} tagId - 标签ID
       * @param {string} name - 标签名
       * @param {string} type - 标签类型
       * @param {string} color - 标签颜色
       * @returns {Object} 操作结果
       */
      console.log('=== updateTag 开始处理 ===');
      const { tagId, name, type, color } = event;
      
      if (!tagId) {
        console.log('❌ 缺少标签ID');
        return { code: -1, msg: '缺少标签ID' };
      }
      
      try {
        const updateData = { updatedAt: new Date() };
        
        if (name) updateData.name = name.trim();
        if (type) updateData.type = type;
        if (color) updateData.color = color;
        
        const result = await db.collection('tags')
          .doc(tagId)
          .update({ data: updateData });
        
        console.log('✅ 标签更新成功');
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 更新标签失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '更新标签失败', error: error.message };
      }
    }
    
    case 'deleteTag': {
      /**
       * 删除标签
       * @param {string} tagId - 标签ID
       * @returns {Object} 操作结果
       */
      console.log('=== deleteTag 开始处理 ===');
      const { tagId } = event;
      
      if (!tagId) {
        console.log('❌ 缺少标签ID');
        return { code: -1, msg: '缺少标签ID' };
      }
      
      try {
        await db.collection('tags')
          .doc(tagId)
          .remove();
        
        console.log('✅ 标签删除成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 删除标签失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '删除标签失败', error: error.message };
      }
    }
    
    case 'searchTags': {
      /**
       * 搜索标签
       * @param {string} keyword - 搜索关键词
       * @param {number} limit - 数量限制
       * @returns {Array} 标签列表
       */
      console.log('=== searchTags 开始处理 ===');
      const { keyword, limit = 20 } = event;
      
      if (!keyword || !keyword.trim()) {
        console.log('❌ 搜索关键词不能为空');
        return { code: -1, msg: '搜索关键词不能为空' };
      }
      
      try {
        const result = await db.collection('tags')
          .where({
            name: db.RegExp({ regexp: keyword.trim(), options: 'i' })
          })
          .orderBy('count', 'desc')
          .limit(limit)
          .get();
        
        console.log('✅ 标签搜索成功，数量:', result.data.length);
        return { code: 0, msg: 'success', data: result.data };
      } catch (error) {
        console.error('❌ 标签搜索失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '标签搜索失败', error: error.message };
      }
    }
    
    case 'initTags': {
      /**
       * 初始化标签数据
       */
      console.log('=== initTags 开始处理 ===');
      try {
        // 初始化标签数据
        const defaultTags = [
          { name: 'AI绘画', type: 'ai', color: 'primary', count: 150 },
          { name: 'Stable Diffusion', type: 'ai', color: 'primary', count: 120 },
          { name: '版权素材', type: 'copyright', color: 'warning', count: 100 },
          { name: '星空', type: 'nature', color: 'success', count: 80 },
          { name: 'illustration', type: 'art', color: 'primary', count: 75 },
          { name: '原创', type: 'original', color: 'success', count: 70 },
          { name: '插画', type: 'art', color: 'primary', count: 65 },
          { name: '设计', type: 'design', color: 'primary', count: 60 },
          { name: '艺术', type: 'art', color: 'primary', count: 55 },
          { name: '创意', type: 'creative', color: 'primary', count: 50 },
          { name: '风景', type: 'nature', color: 'success', count: 45 },
          { name: '人物', type: 'portrait', color: 'primary', count: 40 },
          { name: '动物', type: 'nature', color: 'success', count: 35 },
          { name: '建筑', type: 'architecture', color: 'primary', count: 30 },
          { name: '科技', type: 'technology', color: 'primary', count: 25 }
        ];
        
        // 清空现有数据
        await db.collection('tags').where({}).remove();
        
        // 插入新数据
        for (const tag of defaultTags) {
          await db.collection('tags').add({
            data: {
              ...tag,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        console.log('✅ 标签初始化成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 标签初始化失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '标签初始化失败', error: error.message };
      }
    }
    
    case 'getTagStats': {
      console.log('=== getTagStats 开始处理 ===');
      try {
        // 获取标签统计信息
        const totalTags = await db.collection('tags').count();
        const popularTags = await db.collection('tags')
          .orderBy('count', 'desc')
          .limit(5)
          .get();
        
        const stats = {
          total: totalTags.total,
          popular: popularTags.data
        };
        
        console.log('✅ 标签统计获取成功');
        return { code: 0, msg: 'success', data: stats };
      } catch (error) {
        console.error('❌ 获取标签统计失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取标签统计失败', error: error.message };
      }
    }
    
    default:
      console.log('❌ 未知的 type:', event.type);
      console.log('未知 type 事件详情:', JSON.stringify(event, null, 2));
      return { code: -1, msg: 'unknown type' };
  }
}; 