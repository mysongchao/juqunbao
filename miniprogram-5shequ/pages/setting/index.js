import useToastBehavior from '../../behaviors/useToast';
import { cloudRequest } from '../../api/request';

Page({
  behaviors: [useToastBehavior],
  data: {
    menuData: [
      [
        { title: '通用设置', key: 'general', url: '', icon: 'app' },
        { title: '通知设置', key: 'notification', url: '', icon: 'notification' },
      ],
      [
        { title: '深色模式', key: 'darkMode', url: '', icon: 'image' },
        { title: '字体大小', key: 'fontSize', url: '', icon: 'chart' },
        { title: '播放设置', key: 'play', url: '', icon: 'sound' },
      ],
      [
        { title: '账号安全', key: 'security', url: '', icon: 'secured' },
        { title: '隐私', key: 'privacy', url: '', icon: 'info-circle' },
      ],
    ],
    userSettings: {},
  },

  async onLoad() {
    await this.loadUserSettings();
  },

  async loadUserSettings() {
    try {
      wx.showLoading({ title: '加载设置...' });
      const res = await cloudRequest({ name: 'user', data: { type: 'getUserSettings' } });
      wx.hideLoading();
      if (res.code === 0 && Array.isArray(res.data)) {
        const userSettings = {};
        res.data.forEach(item => { userSettings[item.key] = item.value; });
        this.setData({ userSettings });
        console.log('[setting] 用户设置加载成功:', userSettings);
      } else {
        wx.showToast({ title: '加载设置失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[setting] 加载用户设置失败:', err);
      wx.showToast({ title: '加载设置失败', icon: 'none' });
    }
  },

  onEleClick(e) {
    const { title, url, key } = e.currentTarget.dataset.data;
    console.log('[setting] 菜单点击:', title, 'url:', url, 'key:', key);
    if (url) return;
    this.showSettingModal(title, key);
  },

  showSettingModal(title, key) {
    wx.showModal({
      title: `修改${title}`,
      content: '请输入新值',
      editable: true,
      placeholderText: this.data.userSettings[key] || '',
      success: async (res) => {
        if (res.confirm && res.content !== undefined) {
          await this.saveUserSetting(key, res.content);
        }
      }
    });
  },

  async saveUserSetting(key, value) {
    try {
      wx.showLoading({ title: '保存中...' });
      const res = await cloudRequest({ name: 'user', data: { type: 'updateUserSettings', key, value } });
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ [`userSettings.${key}`]: value });
        console.log('[setting] 设置项保存成功:', key, value);
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[setting] 设置项保存失败:', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
});
