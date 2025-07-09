/**
 * @file cloudfunctions/user/index.js
 * @description 用户相关云函数，处理用户注册、登录、信息获取与更新等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - getOpenId: 获取 openid
 * - wxLogin: 微信登录/注册
 * - getUserInfo: 获取用户信息
 * - updateUserInfo: 更新用户信息
 * - syncWxUserInfo: 同步微信用户信息
 * - createUser: 创建新用户
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'user', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、用户信息等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();
  
  console.log('=== user 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  console.log('APPID:', APPID);
  console.log('UNIONID:', UNIONID);
  
  switch(event.type) {
    case 'getOpenId': {
      /**
       * 获取 openid、appid、unionid
       * @returns {Object} { openid, appid, unionid }
       */
      console.log('=== getOpenId 开始处理 ===');
      const result = { 
        openid: OPENID,
        appid: APPID,
        unionid: UNIONID || null
      };
      console.log('=== getOpenId 返回结果 ===');
      console.log('返回数据:', JSON.stringify(result, null, 2));
      return result;
    }
    
    case 'wxLogin': {
      /**
       * 微信登录/注册
       * @param {Object} userInfo - 用户信息
       * @param {string} encryptedData - 加密数据
       * @param {string} iv - 加密向量
       * @returns {Object} { _id, isNewUser, userInfo }
       */
      console.log('=== wxLogin 开始处理 ===');
      const { userInfo, encryptedData, iv } = event;
      
      if (!userInfo) {
        console.log('❌ 缺少用户信息');
        return { code: -1, msg: '缺少用户信息' };
      }
      
      try {
        // 检查用户是否已存在
        const existUser = await db.collection('users').where({
          openid: OPENID
        }).get();
        
        if (existUser.data && existUser.data.length > 0) {
          // 用户已存在，更新信息
          const user = existUser.data[0];
          const updateData = {
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            language: userInfo.language,
            unionid: UNIONID || user.unionid,
            updatedAt: new Date(),
            lastLoginAt: new Date()
          };
          
          await db.collection('users')
            .doc(user._id)
            .update({ data: updateData });
          
          console.log('✅ 用户信息更新成功:', user._id);
          return { 
            code: 0, 
            msg: 'success', 
            data: { 
              _id: user._id,
              isNewUser: false,
              userInfo: { ...user, ...updateData }
            }
          };
        } else {
          // 创建新用户
          const newUser = {
            openid: OPENID,
            unionid: UNIONID || null,
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            language: userInfo.language,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            status: 'active'
          };
          
          const result = await db.collection('users').add({ data: newUser });
          console.log('✅ 新用户创建成功:', result._id);
          
          return { 
            code: 0, 
            msg: 'success', 
            data: { 
              _id: result._id,
              isNewUser: true,
              userInfo: newUser
            }
          };
        }
      } catch (error) {
        console.error('❌ 微信登录失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '微信登录失败', error: error.message };
      }
    }
    
    case 'getUserInfo': {
      /**
       * 获取用户信息
       * @returns {Object} 用户信息
       */
      console.log('=== getUserInfo 开始处理 ===');
      try {
        const userRes = await db.collection('users').where({
          openid: OPENID
        }).get();
        
        if (userRes.data && userRes.data.length > 0) {
          const userInfo = userRes.data[0];
          console.log('✅ 用户信息获取成功:', userInfo);
          return { code: 0, msg: 'success', data: userInfo };
        } else {
          console.log('❌ 用户不存在');
          return { code: -1, msg: '用户不存在' };
        }
      } catch (error) {
        console.error('❌ 获取用户信息失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取用户信息失败', error: error.message };
      }
    }
    
    case 'updateUserInfo': {
      /**
       * 更新用户信息
       * @param {Object} userInfo - 用户信息
       * @returns {Object} 更新结果
       */
      console.log('=== updateUserInfo 开始处理 ===');
      const { userInfo } = event;
      
      if (!userInfo) {
        console.log('❌ 缺少用户信息');
        return { code: -1, msg: '缺少用户信息' };
      }
      
      try {
        const updateData = {
          ...userInfo,
          updatedAt: new Date()
        };
        
        const result = await db.collection('users').where({
          openid: OPENID
        }).update({ data: updateData });
        
        console.log('✅ 用户信息更新成功:', result);
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 更新用户信息失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '更新用户信息失败', error: error.message };
      }
    }
    
    case 'syncWxUserInfo': {
      /**
       * 同步微信用户信息
       * @param {Object} userInfo - 微信用户信息
       * @returns {Object} 更新结果
       */
      console.log('=== syncWxUserInfo 开始处理 ===');
      const { userInfo } = event;
      
      if (!userInfo) {
        console.log('❌ 缺少用户信息');
        return { code: -1, msg: '缺少用户信息' };
      }
      
      try {
        // 同步微信用户信息
        const syncData = {
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          language: userInfo.language,
          updatedAt: new Date()
        };
        
        const result = await db.collection('users').where({
          openid: OPENID
        }).update({ data: syncData });
        
        console.log('✅ 微信用户信息同步成功:', result);
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 同步微信用户信息失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '同步微信用户信息失败', error: error.message };
      }
    }
    
    case 'createUser': {
      /**
       * 创建新用户
       * @param {Object} userInfo - 用户信息
       * @returns {Object} 创建结果
       */
      console.log('=== createUser 开始处理 ===');
      const { userInfo } = event;
      
      if (!userInfo) {
        console.log('❌ 缺少用户信息');
        return { code: -1, msg: '缺少用户信息' };
      }
      
      try {
        // 检查用户是否已存在
        const existUser = await db.collection('users').where({
          openid: OPENID
        }).get();
        
        if (existUser.data && existUser.data.length > 0) {
          console.log('❌ 用户已存在');
          return { code: -1, msg: '用户已存在' };
        }
        
        // 创建新用户
        const newUser = {
          openid: OPENID,
          unionid: UNIONID || null,
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          language: userInfo.language,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          status: 'active'
        };
        
        const result = await db.collection('users').add({ data: newUser });
        console.log('✅ 用户创建成功:', result._id);
        
        return { code: 0, msg: 'success', data: { _id: result._id } };
      } catch (error) {
        console.error('❌ 创建用户失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '创建用户失败', error: error.message };
      }
    }
    
    case 'getUserContentStats': {
      console.log('=== getUserContentStats 开始处理 ===');
      try {
        // 获取用户内容统计
        const stats = await db.collection('content_cards').where({
          authorId: OPENID
        }).get();
        
        const allContent = stats.data || [];
        const published = allContent.filter(item => item.status === 'published').length;
        const draft = allContent.filter(item => item.status === 'draft').length;
        const progress = allContent.filter(item => item.status === 'progress').length;
        
        const result = {
          all: allContent.length,
          published,
          draft,
          progress
        };
        
        console.log('✅ 用户内容统计获取成功:', result);
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 获取用户内容统计失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取用户内容统计失败', error: error.message };
      }
    }
    
    case 'getUserContentList': {
      console.log('=== getUserContentList 开始处理 ===');
      const { type = 'all', page = 1, pageSize = 20 } = event;
      
      try {
        let query = { authorId: OPENID };
        
        // 根据类型筛选
        if (type !== 'all') {
          query.status = type;
        }
        
        const result = await db.collection('content_cards')
          .where(query)
          .orderBy('createdAt', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        console.log('✅ 用户内容列表获取成功，数量:', result.data.length);
        return { 
          code: 0, 
          msg: 'success', 
          data: {
            list: result.data,
            page,
            pageSize,
            total: result.data.length
          }
        };
      } catch (error) {
        console.error('❌ 获取用户内容列表失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取用户内容列表失败', error: error.message };
      }
    }
    
    case 'checkLoginStatus': {
      console.log('=== checkLoginStatus 开始处理 ===');
      try {
        const userRes = await db.collection('users').where({
          openid: OPENID
        }).get();
        
        const isLoggedIn = userRes.data && userRes.data.length > 0;
        const userInfo = isLoggedIn ? userRes.data[0] : null;
        
        console.log('✅ 登录状态检查完成:', { isLoggedIn, hasUserInfo: !!userInfo });
        return { 
          code: 0, 
          msg: 'success', 
          data: { 
            isLoggedIn,
            userInfo,
            openid: OPENID
          }
        };
      } catch (error) {
        console.error('❌ 检查登录状态失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '检查登录状态失败', error: error.message };
      }
    }
    
    case 'getUserService': {
      console.log('=== getUserService 开始处理 ===');
      // 可根据实际业务改为配置或数据库读取
      const serviceInfo = {
        wechat: 'kf_wechat_123',
        phone: '400-123-4567',
        email: 'service@example.com'
      };
      return { code: 0, msg: 'success', data: serviceInfo };
    }
    
    case 'getUserSettings': {
      console.log('=== getUserSettings 开始处理 ===');
      try {
        const settingsRes = await db.collection('settings').where({ userId: OPENID }).get();
        const settings = settingsRes.data || [];
        return { code: 0, msg: 'success', data: settings };
      } catch (error) {
        console.error('❌ 获取用户设置失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取用户设置失败', error: error.message };
      }
    }
    
    case 'updateUserSettings': {
      console.log('=== updateUserSettings 开始处理 ===');
      const { key, value } = event;
      if (!key) {
        return { code: -1, msg: '缺少设置项key' };
      }
      try {
        // 先查找是否已存在
        const exist = await db.collection('settings').where({ userId: OPENID, key }).get();
        let result;
        if (exist.data && exist.data.length > 0) {
          // 更新
          result = await db.collection('settings').where({ userId: OPENID, key }).update({ data: { value, updatedAt: new Date() } });
        } else {
          // 新增
          result = await db.collection('settings').add({ data: { userId: OPENID, key, value, createdAt: new Date(), updatedAt: new Date() } });
        }
        return { code: 0, msg: 'success', data: result };
      } catch (error) {
        console.error('❌ 更新用户设置失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '更新用户设置失败', error: error.message };
      }
    }
    
    case 'sendVerifyCode': {
      console.log('=== sendVerifyCode（短信验证码发送）接口占位 ===');
      // TODO: 对接短信服务商API，发送验证码
      return { code: -1, msg: '短信验证码功能未实现' };
    }
    case 'verifyCodeLogin': {
      console.log('=== verifyCodeLogin（验证码登录）接口占位 ===');
      // TODO: 校验验证码并自动注册/登录
      return { code: -1, msg: '验证码登录功能未实现' };
    }
    case 'thirdPartyLogin': {
      console.log('=== thirdPartyLogin（第三方登录）接口占位 ===');
      // TODO: 对接微信/QQ/钉钉等OAuth登录
      return { code: -1, msg: '第三方登录功能未实现' };
    }
    
    default:
      console.log('❌ 未知的 type:', event.type);
      console.log('未知 type 事件详情:', JSON.stringify(event, null, 2));
      return { code: -1, msg: 'unknown type' };
  }
}; 