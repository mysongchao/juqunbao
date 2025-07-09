/**
 * @file pages/release/index.js
 * @description 发布页面逻辑，包括图片上传、描述输入、标签选择、定位、草稿保存与内容发布
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - 图片上传与管理
 * - 描述输入与校验
 * - 标签多选与高亮
 * - 定位获取
 * - 草稿保存与内容发布
 *
 * 调用关系：页面操作触发相关方法，最终通过云函数 content 完成数据存储
 */
// pages/release/index.js

import { cloudRequest } from '../../api/request';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    originFiles: [],
    desc: '',
    tags: ['AI绘画', '版权素材', '原创', '风格灵动'],
    selectedTags: [],
    location: null, // { name, latitude, longitude }
    gridConfig: {
      column: 4,
      width: 160,
      height: 160,
    },
    config: {
      count: 1,
    },
  },
  async handleSuccess(e) {
    const { files } = e.detail;
    // 上传新选图片（无 fileID 的）
    const uploadTasks = files.filter(f => !f.fileID).map(async (f) => {
      const res = await wx.cloud.uploadFile({
        cloudPath: `release/${Date.now()}_${Math.floor(Math.random()*10000)}.png`,
        filePath: f.url,
      });
      return { ...f, fileID: res.fileID };
    });
    const uploaded = await Promise.all(uploadTasks);
    // 合并已上传和新上传
    const allFiles = files.map(f => uploaded.find(u => u.url === f.url) || f);
    this.setData({ originFiles: allFiles });
  },
  handleRemove(e) {
    const { index } = e.detail;
    const { originFiles } = this.data;
    originFiles.splice(index, 1);
    this.setData({ originFiles });
  },
  onDescInput(e) {
    console.log('[onDescInput] 事件触发', e);
    console.log('[onDescInput] e.detail:', e.detail);
    console.log('[onDescInput] e.detail.value:', e.detail.value);
    console.log('[onDescInput] 当前 this.data.desc:', this.data.desc);
    
    const value = e.detail.value;
    this.setData({ desc: value });
    
    console.log('[onDescInput] 设置后 this.data.desc:', this.data.desc);
  },
  onTagTap(e) {
    const { value } = e.currentTarget.dataset;
    const now = Date.now();
    if (!this.lastTap) this.lastTap = {};
    if (!this.tapTimer) this.tapTimer = {};
    // 双击检测
    if (this.lastTap[value] && now - this.lastTap[value] < 300) {
      // 双击，取消选中
      let { selectedTags } = this.data;
      selectedTags = selectedTags.filter(tag => tag !== value);
      this.setData({ selectedTags });
      this.lastTap[value] = 0;
      clearTimeout(this.tapTimer[value]);
      return;
    }
    this.lastTap[value] = now;
    // 单击，选中并点亮
    if (!this.data.selectedTags.includes(value)) {
      this.setData({ selectedTags: [...this.data.selectedTags, value] });
    }
    // 300ms 内未双击则重置
    this.tapTimer[value] = setTimeout(() => {
      this.lastTap[value] = 0;
    }, 350);
  },
  gotoMap() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          location: {
            name: '当前位置',
            latitude: res.latitude,
            longitude: res.longitude,
          },
        });
        wx.showToast({ title: '定位成功', icon: 'success' });
        console.log('定位成功', res);
      },
      fail: (err) => {
        wx.showToast({ title: '定位失败', icon: 'none' });
        console.warn('定位失败', err);
        // 定位失败不影响后续流程
        this.setData({ location: null });
      },
    });
  },
  async saveDraft() {
    const { originFiles, desc, selectedTags, location } = this.data;
    const images = originFiles.map(f => f.fileID).filter(Boolean);
    
    console.log('[saveDraft] 开始保存草稿');
    console.log('[saveDraft] originFiles:', originFiles);
    console.log('[saveDraft] desc:', desc);
    console.log('[saveDraft] selectedTags:', selectedTags);
    console.log('[saveDraft] location:', location);
    console.log('[saveDraft] images:', images);
    
    if (!images.length || !desc || !selectedTags.length) {
      wx.showToast({ title: '请完善内容', icon: 'none' });
      console.warn('草稿保存失败：内容不完整', { images, desc, selectedTags });
      return;
    }
    try {
      const requestData = {
        type: 'draft',
        images,
        desc,
        tags: selectedTags,
        location,
      };
      console.log('[saveDraft] 请求数据:', requestData);
      
      await cloudRequest({
        name: 'content',
        data: requestData,
      });
      wx.showToast({ title: '草稿已保存', icon: 'success' });
      wx.reLaunch({ url: `/pages/home/index?oper=save` });
      console.log('草稿保存成功', { images, desc, selectedTags, location });
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.error('保存草稿失败', err);
    }
  },
  async release() {
    const { originFiles, desc, selectedTags, location } = this.data;
    const images = originFiles.map(f => f.fileID).filter(Boolean);
    
    console.log('[release] 开始发布');
    console.log('[release] originFiles:', originFiles);
    console.log('[release] desc:', desc);
    console.log('[release] selectedTags:', selectedTags);
    console.log('[release] location:', location);
    console.log('[release] images:', images);
    console.log('[release] desc 类型:', typeof desc);
    console.log('[release] desc 长度:', desc ? desc.length : 0);
    
    if (!images.length || !desc || !selectedTags.length) {
      wx.showToast({ title: '请完善内容', icon: 'none' });
      console.warn('发布失败：内容不完整', { images, desc, selectedTags });
      return;
    }
    try {
      const requestData = {
        type: 'publish',
        images,
        desc,
        tags: selectedTags,
        location,
      };
      console.log('[release] 请求数据:', requestData);
      
      await cloudRequest({
        name: 'content',
        data: requestData,
      });
      wx.showToast({ title: '发布成功', icon: 'success' });
      wx.reLaunch({ url: `/pages/home/index?oper=release` });
      console.log('发布成功', { images, desc, selectedTags, location });
    } catch (err) {
      wx.showToast({ title: '发布失败', icon: 'none' });
      console.error('发布失败', err);
    }
  },
});
