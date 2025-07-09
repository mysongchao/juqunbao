// 微信授权登录工具类
import { cloudRequest } from '../api/request';

class WxAuth {
  constructor() {
    this.userInfo = null;
    this.isLoggedIn = false;
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      console.log('[WxAuth] 检查登录状态');
      const result = await cloudRequest({
        name: 'user',
        data: { type: 'checkLoginStatus' }
      });

      if (result.code === 0) {
        this.isLoggedIn = result.data.isLoggedIn;
        this.userInfo = result.data.userInfo;
        
        console.log('[WxAuth] 登录状态检查结果:', {
          isLoggedIn: this.isLoggedIn,
          hasUserInfo: !!this.userInfo
        });
        
        return result.data;
      } else {
        console.error('[WxAuth] 检查登录状态失败:', result.msg);
        return { isLoggedIn: false, userInfo: null };
      }
    } catch (error) {
      console.error('[WxAuth] 检查登录状态异常:', error);
      return { isLoggedIn: false, userInfo: null };
    }
  }

  /**
   * 微信授权登录
   */
  async wxLogin() {
    try {
      console.log('[WxAuth] 开始微信授权登录');
      
      // 1. 获取用户信息
      console.log('[WxAuth] 步骤1: 调用wx.getUserProfile获取用户信息');
      const userInfo = await this.getUserProfile();
      if (!userInfo) {
        throw new Error('获取用户信息失败');
      }
      
      console.log('[WxAuth] 步骤1完成: 获取到用户信息:', {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl ? '已获取' : '未获取',
        language: userInfo.language
      });

      // 2. 调用云函数进行登录
      console.log('[WxAuth] 步骤2: 调用云函数进行登录');
      const result = await cloudRequest({
        name: 'user',
        data: {
          type: 'wxLogin',
          userInfo: userInfo
        }
      });

      console.log('[WxAuth] 步骤2完成: 云函数返回结果:', result);

      if (result.code === 0) {
        this.isLoggedIn = true;
        this.userInfo = result.data.userInfo;
        
        console.log('[WxAuth] 微信登录成功:', {
          isNewUser: result.data.isNewUser,
          userId: result.data._id,
          userInfo: {
            nickname: this.userInfo.nickname,
            avatar: this.userInfo.avatar,
            city: this.userInfo.city
          }
        });
        
        // 3. 保存用户信息到本地存储
        console.log('[WxAuth] 步骤3: 保存用户信息到本地存储');
        wx.setStorageSync('userInfo', this.userInfo);
        wx.setStorageSync('isLoggedIn', true);
        
        return result.data;
      } else {
        throw new Error(result.msg || '登录失败');
      }
    } catch (error) {
      console.error('[WxAuth] 微信登录失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户信息是否完整
   */
  checkUserInfoComplete(userInfo) {
    const issues = [];
    
    if (!userInfo.nickName || userInfo.nickName === '微信用户') {
      issues.push('昵称为默认值或为空');
    }
    
    if (!userInfo.avatarUrl) {
      issues.push('头像URL为空');
    }
    
    // 注意：根据微信2021-09-26公告，不再检查以下字段：
    // gender, country, province, city 已不再返回
    
    if (issues.length > 0) {
      console.warn('[WxAuth] 用户信息不完整:', issues);
      return {
        isComplete: false,
        issues: issues
      };
    }
    
    return {
      isComplete: true,
      issues: []
    };
  }

  /**
   * 获取用户信息 (使用 wx.getUserProfile)
   */
  async getUserProfile() {
    return new Promise((resolve, reject) => {
      // 使用简短的描述，确保符合微信要求
      // 如果还有问题，可以尝试更短的描述：'用户资料' 或 '完善资料'
      const desc = '完善用户资料';
      
      console.log('[WxAuth] 调用wx.getUserProfile，描述:', desc);
      
      wx.getUserProfile({
        desc: desc, // 简化描述，确保长度在1-30字符之间
        lang: 'zh_CN',
        success: (res) => {
          console.log('[WxAuth] 获取用户信息成功:', res.userInfo);
          
          // 检查获取到的用户信息
          const userInfo = res.userInfo;
          console.log('[WxAuth] 用户信息详情:', {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            language: userInfo.language
          });
          
          // 检查用户信息完整性（根据新接口调整）
          const checkResult = this.checkUserInfoComplete(userInfo);
          if (!checkResult.isComplete) {
            console.warn('[WxAuth] 用户信息不完整，可能的原因:', checkResult.issues);
            console.warn('[WxAuth] 建议检查小程序权限配置和用户授权设置');
          }
          
          // 如果昵称是默认值，给出提示
          if (userInfo.nickName === '微信用户' || !userInfo.nickName) {
            wx.showModal({
              title: '授权提示',
              content: '未能获取您的微信昵称和头像，请在微信设置中授权"用户信息"后重试，或卸载小程序后重新进入并授权。',
              showCancel: true,
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
              }
            });
          }
          
          resolve(userInfo);
        },
        fail: (err) => {
          console.error('[WxAuth] 获取用户信息失败:', err);
          
          // 详细的错误处理
          let errorMsg = '用户拒绝授权';
          if (err.errMsg) {
            if (err.errMsg.includes('getUserProfile:fail auth deny')) {
              errorMsg = '用户拒绝授权获取用户信息';
            } else if (err.errMsg.includes('desc length does not meet the requirements')) {
              errorMsg = '描述信息长度不符合要求';
            } else if (err.errMsg.includes('getUserProfile:fail invalid desc')) {
              errorMsg = '描述信息格式不正确';
            } else if (err.errMsg.includes('getUserProfile:fail')) {
              errorMsg = '获取用户信息失败';
            }
          }
          
          console.error('[WxAuth] 错误详情:', {
            errMsg: err.errMsg,
            errorMsg: errorMsg
          });
          
          reject(new Error(errorMsg));
        }
      });
    });
  }

  /**
   * 静默登录 (仅获取openid，不获取用户信息)
   */
  async silentLogin() {
    try {
      console.log('[WxAuth] 开始静默登录');
      
      const result = await cloudRequest({
        name: 'user',
        data: { type: 'getOpenId' }
      });

      if (result.openid) {
        console.log('[WxAuth] 静默登录成功，获取到openid');
        return { openid: result.openid };
      } else {
        throw new Error('获取openid失败');
      }
    } catch (error) {
      console.error('[WxAuth] 静默登录失败:', error);
      throw error;
    }
  }

  /**
   * 同步微信用户信息
   */
  async syncWxUserInfo() {
    try {
      console.log('[WxAuth] 开始同步微信用户信息');
      
      // 检查是否已有用户信息
      if (this.userInfo && this.userInfo.nickname && this.userInfo.nickname !== '微信用户') {
        console.log('[WxAuth] 用户信息已存在且非默认值，无需同步');
        return { code: 0, msg: '用户信息已是最新' };
      }
      
      // 尝试获取新的用户信息
      const userInfo = await this.getUserProfile();
      const result = await cloudRequest({
        name: 'user',
        data: {
          type: 'syncWxUserInfo',
          userInfo: userInfo
        }
      });

      if (result.code === 0) {
        // 更新本地用户信息
        this.userInfo = { ...this.userInfo, ...userInfo };
        wx.setStorageSync('userInfo', this.userInfo);
        
        console.log('[WxAuth] 微信用户信息同步成功');
        return result.data;
      } else {
        throw new Error(result.msg || '同步失败');
      }
    } catch (error) {
      console.error('[WxAuth] 同步微信用户信息失败:', error);
      
      // 如果是权限问题，提供更友好的错误信息
      if (error.message.includes('用户拒绝授权') || error.message.includes('获取用户信息失败')) {
        throw new Error('需要重新授权才能同步用户信息，请点击头像重新授权');
      }
      
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userInfo) {
    try {
      console.log('[WxAuth] 开始更新用户信息');
      
      const result = await cloudRequest({
        name: 'user',
        data: {
          type: 'updateUserInfo',
          userInfo: userInfo
        }
      });

      if (result.code === 0) {
        // 更新本地用户信息
        this.userInfo = { ...this.userInfo, ...userInfo };
        wx.setStorageSync('userInfo', this.userInfo);
        
        console.log('[WxAuth] 用户信息更新成功');
        return result.data;
      } else {
        throw new Error(result.msg || '更新失败');
      }
    } catch (error) {
      console.error('[WxAuth] 更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      console.log('[WxAuth] 获取用户信息');
      
      const result = await cloudRequest({
        name: 'user',
        data: { type: 'getUserInfo' }
      });

      if (result.code === 0) {
        this.userInfo = result.data;
        wx.setStorageSync('userInfo', this.userInfo);
        
        console.log('[WxAuth] 用户信息获取成功');
        return result.data;
      } else {
        throw new Error(result.msg || '获取用户信息失败');
      }
    } catch (error) {
      console.error('[WxAuth] 获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 退出登录
   */
  logout() {
    console.log('[WxAuth] 退出登录');
    
    this.isLoggedIn = false;
    this.userInfo = null;
    
    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('isLoggedIn');
    
    console.log('[WxAuth] 退出登录完成');
  }

  /**
   * 从本地存储恢复登录状态
   */
  restoreFromStorage() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      
      if (userInfo && isLoggedIn) {
        this.userInfo = userInfo;
        this.isLoggedIn = true;
        console.log('[WxAuth] 从本地存储恢复登录状态成功');
        return true;
      } else {
        console.log('[WxAuth] 本地存储中无登录信息');
        return false;
      }
    } catch (error) {
      console.error('[WxAuth] 从本地存储恢复登录状态失败:', error);
      return false;
    }
  }

  /**
   * 检查是否需要登录
   */
  async checkNeedLogin() {
    // 先检查本地存储
    const hasLocalLogin = this.restoreFromStorage();
    
    if (hasLocalLogin) {
      // 验证服务器端登录状态
      const serverStatus = await this.checkLoginStatus();
      if (serverStatus.isLoggedIn) {
        return false; // 已登录，不需要重新登录
      }
    }
    
    return true; // 需要登录
  }

  /**
   * 确保登录状态
   */
  async ensureLogin() {
    const needLogin = await this.checkNeedLogin();
    
    if (needLogin) {
      console.log('[WxAuth] 需要登录，开始微信授权登录');
      return await this.wxLogin();
    } else {
      console.log('[WxAuth] 已登录，无需重新登录');
      return { isNewUser: false, userInfo: this.userInfo };
    }
  }
}

// 创建单例实例
const wxAuth = new WxAuth();

export default wxAuth; 