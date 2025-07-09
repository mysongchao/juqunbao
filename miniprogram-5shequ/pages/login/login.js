import request from '../../api/request';

Page({
  data: {
    phoneNumber: '',
    isPhoneNumber: false,
    isCheck: false,
    isSubmit: false,
    isPasswordLogin: false,
    passwordInfo: {
      account: '',
      password: '',
    },
    radioValue: '',
    // 第三方登录按钮配置（可扩展）
    thirdPartyList: [
      { type: 'wechat', name: '微信登录', icon: '/static/wechat.png' },
      { type: 'qq', name: 'QQ登录', icon: '/static/qq.png' },
      { type: 'dingtalk', name: '钉钉登录', icon: '/static/dingtalk.png' },
    ],
  },

  /* 自定义功能函数 */
  changeSubmit() {
    if (this.data.isPasswordLogin) {
      if (this.data.passwordInfo.account !== '' && this.data.passwordInfo.password !== '' && this.data.isCheck) {
        this.setData({ isSubmit: true });
      } else {
        this.setData({ isSubmit: false });
      }
    } else if (this.data.isPhoneNumber && this.data.isCheck) {
      this.setData({ isSubmit: true });
    } else {
      this.setData({ isSubmit: false });
    }
  },

  // 手机号变更
  onPhoneInput(e) {
    const isPhoneNumber = /^[1][3,4,5,7,8,9][0-9]{9}$/.test(e.detail.value);
    this.setData({
      isPhoneNumber,
      phoneNumber: e.detail.value,
    });
    this.changeSubmit();
  },

  // 用户协议选择变更
  onCheckChange(e) {
    const { value } = e.detail;
    this.setData({
      radioValue: value,
      isCheck: value === 'agree',
    });
    this.changeSubmit();
  },

  onAccountChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, account: e.detail.value } });
    this.changeSubmit();
  },

  onPasswordChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, password: e.detail.value } });
    this.changeSubmit();
  },

  // 切换登录方式
  changeLogin() {
    this.setData({ isPasswordLogin: !this.data.isPasswordLogin, isSubmit: false });
  },

  async login() {
    try {
    if (this.data.isPasswordLogin) {
      const res = await request('/login/postPasswordLogin', 'post', { data: this.data.passwordInfo });
      if (res.success) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.switchTab({
          url: `/pages/my/index`,
        });
      }
    } else {
      const res = await request('/login/getSendMessage', 'get');
      if (res.success) {
        wx.navigateTo({
          url: `/pages/loginCode/loginCode?phoneNumber=${this.data.phoneNumber}`,
        });
      }
    }
    } catch (err) {
      console.error('[login] 登录失败:', err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  /**
   * 第三方登录入口（占位，后续可对接云函数 thirdPartyLogin）
   */
  onThirdPartyLogin(e) {
    const { type } = e.currentTarget.dataset;
    wx.showToast({ title: `${type}登录暂未实现`, icon: 'none' });
    // TODO: 调用云函数 user.type=thirdPartyLogin，传递 type/code
  },

  /**
   * 验证码登录入口（占位，后续可对接云函数 verifyCodeLogin）
   */
  onVerifyCodeLogin() {
    wx.showToast({ title: '验证码登录暂未实现', icon: 'none' });
    // TODO: 调用云函数 user.type=verifyCodeLogin，传递手机号/验证码
  },
});
