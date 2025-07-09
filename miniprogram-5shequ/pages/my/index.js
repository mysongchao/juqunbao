/**
 * @file pages/my/index.js
 * @description 个人中心页面逻辑，包括登录、用户信息展示、内容统计、服务与设置入口等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - 微信授权登录与同步
 * - 用户信息与内容统计展示
 * - 服务推荐与设置入口
 * - 事件处理与页面跳转
 *
 * 调用关系：页面 onLoad/onShow 时自动加载数据，用户操作触发相关方法
 */
import { cloudRequest } from '../../api/request';
import useToastBehavior from '../../behaviors/useToast';
import wxAuth from '../../utils/wxAuth';
const { smartTruncate } = require('../../utils/stringUtil');

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    service: [],
    personalInfo: {},
    gridList: [
      {
        name: '全部发布',
        icon: 'root-list',
        type: 'all',
        url: '',
      },
      {
        name: '审核中',
        icon: 'search',
        type: 'progress',
        url: '',
      },
      {
        name: '已发布',
        icon: 'upload',
        type: 'published',
        url: '',
      },
      {
        name: '草稿箱',
        icon: 'file-copy',
        type: 'draft',
        url: '',
      },
    ],

    settingList: [
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.getServiceList();
  },

  async onShow() {
    console.log('[my] 页面显示，开始检查登录状态');
    await this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      console.log('[my] 开始检查登录状态');
      
      // 使用微信授权工具检查登录状态
      const loginStatus = await wxAuth.checkLoginStatus();
      
      if (loginStatus.isLoggedIn && loginStatus.userInfo) {
        console.log('[my] 用户已登录:', loginStatus.userInfo);
        
        // 获取用户内容统计
        const stats = await this.getUserContentStats();
        
        this.setData({
          isLoad: true,
          personalInfo: {
            name: loginStatus.userInfo.nickname || loginStatus.userInfo.nickName || '微信用户',
            image: loginStatus.userInfo.avatar || loginStatus.userInfo.avatarUrl || '',
            star: stats.published || 0,
            ...loginStatus.userInfo
          },
        });
      } else {
        console.log('[my] 用户未登录，显示登录界面');
        this.setData({
          isLoad: false,
          personalInfo: {}
        });
      }
    } catch (error) {
      console.error('[my] 检查登录状态失败:', error);
      this.setData({
        isLoad: false,
        personalInfo: {}
      });
    }
  },

  /**
   * 获取用户内容统计
   */
  async getUserContentStats() {
    try {
      const result = await cloudRequest({
        name: 'user',
        data: { type: 'getUserContentStats' }
      });
      
      if (result.code === 0) {
        return result.data;
      } else {
        console.warn('[my] 获取用户内容统计失败:', result.msg);
        return { all: 0, published: 0, draft: 0, progress: 0 };
      }
    } catch (error) {
      console.error('[my] 获取用户内容统计异常:', error);
      return { all: 0, published: 0, draft: 0, progress: 0 };
    }
  },

  getServiceList() {
    // 这里可以调用云函数获取服务列表
    // 暂时使用模拟数据
    const mockService = [
      { name: '客服咨询', image: '/static/service1.png', url: '' },
      { name: '意见反馈', image: '/static/service2.png', url: '' },
      { name: '帮助中心', image: '/static/service3.png', url: '' },
      { name: '关于我们', image: '/static/service4.png', url: '' }
    ];
    
    this.setData({ service: mockService });
  },

  /**
   * 微信授权登录
   */
  async onLogin() {
    try {
      console.log('[my] 开始微信授权登录');
      
      wx.showLoading({ title: '登录中...' });
      
      // 使用微信授权工具进行登录
      const loginResult = await wxAuth.wxLogin();
      
      wx.hideLoading();
      
      if (loginResult.isNewUser) {
        wx.showToast({
          title: '欢迎新用户！',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      }
      
      // 重新加载用户信息
      await this.checkLoginStatus();
      
    } catch (error) {
      wx.hideLoading();
      console.error('[my] 微信登录失败:', error);
      
      if (error.message === '用户拒绝授权') {
        wx.showModal({
          title: '提示',
          content: '需要获取您的微信头像和昵称才能使用完整功能',
          showCancel: true,
          confirmText: '重新授权',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.onLogin();
            }
          }
        });
      } else {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    }
  },

  /**
   * 同步微信用户信息
   */
  async onSyncUserInfo() {
    try {
      console.log('[my] 开始同步微信用户信息');
      
      // 检查当前用户信息
      if (this.data.personalInfo.nickname && this.data.personalInfo.nickname !== '微信用户') {
        wx.showModal({
          title: '提示',
          content: '您的用户信息已是最新，是否仍要重新同步？',
          success: (res) => {
            if (res.confirm) {
              this.performSyncUserInfo();
            }
          }
        });
        return;
      }
      
      // 直接执行同步
      await this.performSyncUserInfo();
      
    } catch (error) {
      console.error('[my] 同步用户信息失败:', error);
      wx.showToast({
        title: '同步失败',
        icon: 'none'
      });
    }
  },

  /**
   * 执行同步用户信息
   */
  async performSyncUserInfo() {
    try {
      wx.showLoading({ title: '同步中...' });
      
      await wxAuth.syncWxUserInfo();
      
      wx.hideLoading();
      wx.showToast({
        title: '同步成功',
        icon: 'success'
      });
      
      // 重新加载用户信息
      await this.checkLoginStatus();
      
    } catch (error) {
      wx.hideLoading();
      console.error('[my] 执行同步失败:', error);
      
      if (error.message.includes('需要重新授权')) {
        wx.showModal({
          title: '需要重新授权',
          content: '为了获取您的真实头像和昵称，需要重新授权。请点击"重新授权"按钮。',
          showCancel: true,
          confirmText: '重新授权',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 引导用户重新登录
              this.onLogin();
            }
          }
        });
      } else {
        wx.showToast({
          title: error.message || '同步失败',
          icon: 'none'
        });
      }
    }
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('[my] 用户确认退出登录');
          
          // 使用微信授权工具退出登录
          wxAuth.logout();
          
          this.setData({
            isLoad: false,
            personalInfo: {}
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  onNavigateTo() {
    // 检查登录状态
    if (!this.data.isLoad) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  onEleClick(e) {
    const { name, url, type } = e.currentTarget.dataset.data;
    
    // 检查登录状态
    if (!this.data.isLoad && type !== 'service') {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    if (url) {
      wx.navigateTo({ url });
      return;
    }
    
    // 处理特殊功能
    switch (type) {
      case 'service':
        this.showServiceModal();
        break;
      case 'setting':
        wx.navigateTo({ url: '/pages/setting/index' });
        break;
      default:
    this.onShowToast('#t-toast', name);
    }
  },

  async showServiceModal() {
    try {
      wx.showLoading({ title: '获取客服信息...' });
      const res = await cloudRequest({ name: 'user', data: { type: 'getUserService' } });
      wx.hideLoading();
      if (res.code === 0 && res.data) {
        const { wechat, phone, email } = res.data;
        wx.showModal({
          title: '联系客服',
          content: `微信：${wechat}\n电话：${phone}\n邮箱：${email}`,
          showCancel: true,
          confirmText: '复制微信',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.setClipboardData({ data: wechat, success: () => wx.showToast({ title: '已复制微信号' }) });
            }
          }
        });
      } else {
        wx.showToast({ title: '获取客服信息失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[my] 获取客服信息失败:', err);
      wx.showToast({ title: '获取客服信息失败', icon: 'none' });
    }
  },

  transformCardData(rawData) {
    return rawData.map(item => ({
      ...item,
      desc: smartTruncate(item.desc || '')
    }));
  },
});
