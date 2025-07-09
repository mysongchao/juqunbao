/**
 * @file cloudfunctions/message/index.js
 * @description 消息/聊天相关云函数，处理消息列表、聊天记录、发送消息等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - getMessageList: 获取消息列表
 * - getChatHistory: 获取聊天记录
 * - sendMessage: 发送消息
 * - markAsRead: 标记消息为已读
 * - getUnreadCount: 获取未读消息数
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'message', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、消息参数等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID } = cloud.getWXContext();
  
  console.log('=== message 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  
  switch(event.type) {
    case 'getMessageList': {
      /**
       * 获取用户消息列表
       * @returns {Array} 消息列表
       */
      console.log('=== getMessageList 开始处理 ===');
      try {
        // 获取用户的消息列表（最近的消息）
        const result = await db.collection('messages')
          .where({
            $or: [
              { fromUserId: OPENID },
              { toUserId: OPENID }
            ]
          })
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        
        // 按对话分组，获取最新的消息
        const messageMap = new Map();
        result.data.forEach(msg => {
          const otherUserId = msg.fromUserId === OPENID ? msg.toUserId : msg.fromUserId;
          if (!messageMap.has(otherUserId) || messageMap.get(otherUserId).createdAt < msg.createdAt) {
            messageMap.set(otherUserId, {
              ...msg,
              otherUserId,
              isFromMe: msg.fromUserId === OPENID
            });
          }
        });
        
        const messageList = Array.from(messageMap.values());
        console.log('✅ 消息列表获取成功，数量:', messageList.length);
        
        return { code: 0, msg: 'success', data: messageList };
      } catch (error) {
        console.error('❌ 获取消息列表失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取消息列表失败', error: error.message };
      }
    }
    
    case 'getChatHistory': {
      /**
       * 获取与指定用户的聊天记录
       * @param {string} toUserId - 对方用户ID
       * @param {number} page - 页码
       * @param {number} pageSize - 每页条数
       * @returns {Object} { list, page, pageSize, total }
       */
      console.log('=== getChatHistory 开始处理 ===');
      const { toUserId, page = 1, pageSize = 20 } = event;
      
      if (!toUserId) {
        console.log('❌ 缺少目标用户ID');
        return { code: -1, msg: '缺少目标用户ID' };
      }
      
      try {
        const result = await db.collection('messages')
          .where({
            $or: [
              { fromUserId: OPENID, toUserId: toUserId },
              { fromUserId: toUserId, toUserId: OPENID }
            ]
          })
          .orderBy('createdAt', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        // 标记消息为已读
        const unreadMessages = result.data.filter(msg => 
          msg.toUserId === OPENID && !msg.isRead
        );
        
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg._id);
          await db.collection('messages')
            .where({
              _id: db.command.in(messageIds)
            })
            .update({
              data: { isRead: true, readAt: new Date() }
            });
        }
        
        console.log('✅ 聊天记录获取成功，数量:', result.data.length);
        return { 
          code: 0, 
          msg: 'success', 
          data: {
            list: result.data.reverse(), // 按时间正序返回
            page,
            pageSize,
            total: result.data.length
          }
        };
      } catch (error) {
        console.error('❌ 获取聊天记录失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取聊天记录失败', error: error.message };
      }
    }
    
    case 'sendMessage': {
      /**
       * 发送消息
       * @param {string} toUserId - 接收方用户ID
       * @param {string} content - 消息内容
       * @param {string} messageType - 消息类型
       * @returns {Object} { _id }
       */
      console.log('=== sendMessage 开始处理 ===');
      const { toUserId, content, messageType = 'text' } = event;
      
      if (!toUserId || !content) {
        console.log('❌ 缺少必要参数');
        return { code: -1, msg: '缺少必要参数' };
      }
      
      try {
        const messageData = {
          fromUserId: OPENID,
          toUserId: toUserId,
          content: content,
          messageType: messageType, // text, image, file
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await db.collection('messages').add({ data: messageData });
        console.log('✅ 消息发送成功:', result._id);
        
        return { code: 0, msg: 'success', data: { _id: result._id } };
      } catch (error) {
        console.error('❌ 发送消息失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '发送消息失败', error: error.message };
      }
    }
    
    case 'markAsRead': {
      /**
       * 标记消息为已读
       * @param {string} messageId - 消息ID
       * @param {string} toUserId - 对方用户ID
       * @returns {Object} 操作结果
       */
      console.log('=== markAsRead 开始处理 ===');
      const { messageId, toUserId } = event;
      
      try {
        let query = {};
        
        if (messageId) {
          // 标记单条消息为已读
          query._id = messageId;
        } else if (toUserId) {
          // 标记与指定用户的所有未读消息为已读
          query = {
            fromUserId: toUserId,
            toUserId: OPENID,
            isRead: false
          };
        } else {
          console.log('❌ 缺少必要参数');
          return { code: -1, msg: '缺少必要参数' };
        }
        
        const result = await db.collection('messages')
          .where(query)
          .update({
            data: { 
              isRead: true, 
              readAt: new Date() 
            }
          });
        
        console.log('✅ 消息标记为已读成功');
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 标记消息为已读失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '标记消息为已读失败', error: error.message };
      }
    }
    
    case 'getUnreadCount': {
      /**
       * 获取未读消息数
       * @returns {number} 未读消息数
       */
      console.log('=== getUnreadCount 开始处理 ===');
      try {
        const result = await db.collection('messages')
          .where({
            toUserId: OPENID,
            isRead: false
          })
          .count();
        
        const unreadCount = result.total;
        console.log('✅ 未读消息数获取成功:', unreadCount);
        
        return { code: 0, msg: 'success', data: unreadCount };
      } catch (error) {
        console.error('❌ 获取未读消息数失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取未读消息数失败', error: error.message };
      }
    }
    
    case 'deleteMessage': {
      console.log('=== deleteMessage 开始处理 ===');
      const { messageId } = event;
      
      if (!messageId) {
        console.log('❌ 缺少消息ID');
        return { code: -1, msg: '缺少消息ID' };
      }
      
      try {
        // 只能删除自己发送的消息
        await db.collection('messages')
          .where({
            _id: messageId,
            fromUserId: OPENID
          })
          .remove();
        
        console.log('✅ 消息删除成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 删除消息失败:', error);
        return { code: -1, msg: '删除消息失败', error: error.message };
      }
    }
    
    case 'clearChatHistory': {
      console.log('=== clearChatHistory 开始处理 ===');
      const { toUserId } = event;
      
      if (!toUserId) {
        console.log('❌ 缺少目标用户ID');
        return { code: -1, msg: '缺少目标用户ID' };
      }
      
      try {
        await db.collection('messages')
          .where({
            $or: [
              { fromUserId: OPENID, toUserId: toUserId },
              { fromUserId: toUserId, toUserId: OPENID }
            ]
          })
          .remove();
        
        console.log('✅ 聊天记录清空成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 清空聊天记录失败:', error);
        return { code: -1, msg: '清空聊天记录失败', error: error.message };
      }
    }
    
    default:
      console.log('❌ 未知的 type:', event.type);
      console.log('未知 type 事件详情:', JSON.stringify(event, null, 2));
      return { code: -1, msg: 'unknown type' };
  }
}; 