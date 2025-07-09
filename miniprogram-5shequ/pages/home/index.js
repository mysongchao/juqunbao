/**
 * @file pages/home/index.js
 * @description 首页页面逻辑，包括内容流获取、轮播图展示、管理员检测、下拉刷新等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - 加载首页内容流和轮播图
 * - 检查管理员权限
 * - 下拉刷新
 * - 处理内容卡片和轮播图点击
 *
 * 调用关系：页面 onLoad/onReady 时自动加载数据，用户操作触发相关方法
 */
import Message from 'tdesign-miniprogram/message/index';
import { cloudRequest } from '../../api/request';
import adminConfig from '../../config/admin';
const { smartTruncate } = require('../../utils/stringUtil');

// 获取应用实例
// const app = getApp()

Page({
  data: {
    enable: false,
    swiperList: [],
    cardInfo: [],
    // 发布
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
    // 管理员相关
    isAdmin: false,
  },
  // 生命周期
  async onReady() {
    console.log('[home] onReady 生命周期开始');
    await this.checkAdminStatus();
    await this.loadData();
    console.log('[home] onReady 生命周期完成');
  },
  onLoad(option) {
    console.log('[home] onLoad 生命周期开始，参数:', option);
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true,
      });
    }
    if (option.oper) {
      let content = '';
      if (option.oper === 'release') {
        content = '发布成功';
      } else if (option.oper === 'save') {
        content = '保存成功';
      }
      console.log('[home] 显示操作消息:', content);
      this.showOperMsg(content);
    }
    console.log('[home] onLoad 生命周期完成');
  },
  onRefresh() {
    console.log('[home] 下拉刷新触发');
    this.refresh();
  },
  async refresh() {
    console.log('[home] 开始刷新数据');
    this.setData({
      enable: true,
    });
    
    await this.loadData();

    setTimeout(() => {
      this.setData({
        enable: false,
      });
      console.log('[home] 刷新完成');
    }, 1500);
  },
  
  // 检查管理员状态
  async checkAdminStatus() {
    console.log('[home] 开始检查管理员状态');
    try {
      // 获取当前用户openid
      const { result } = await wx.cloud.callFunction({
        name: 'user',
        data: { type: 'getOpenId' }
      });
      
      const currentOpenId = result.openid;
      console.log('[home] 当前用户openid:', currentOpenId);
      
      // 检查是否为管理员
      const isAdmin = adminConfig.isAdmin(currentOpenId);
      console.log('[home] 管理员检查结果:', isAdmin);
      
      this.setData({ isAdmin });
      
    } catch (error) {
      console.error('[home] 检查管理员状态失败:', error);
      this.setData({ isAdmin: false });
    }
  },
  
  // 转换数据格式，适配卡片组件
  transformCardData(rawData) {
    console.log('[home] 开始转换卡片数据，原始数据数量:', rawData.length);
    console.log('[home] 原始数据详情:', JSON.stringify(rawData, null, 2));
    
    const transformedData = rawData.map((item, index) => {
      console.log(`[home] 转换第 ${index + 1} 条数据:`, item);
      
      const transformed = {
        _id: item._id,
        url: item.images && item.images.length > 0 ? item.images[0] : '', // 取第一张图片作为主图
        desc: smartTruncate(item.desc || '', 20, false),
        tags: this.transformTags(item.tags || []), // 转换标签格式
        authorId: item.authorId,
        createdAt: item.createdAt,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        // 保留原始数据
        originalData: item
      };
      
      console.log(`[home] 第 ${index + 1} 条数据转换结果:`, transformed);
      return transformed;
    });
    
    console.log('[home] 数据转换完成，转换后数据数量:', transformedData.length);
    console.log('[home] 转换后数据详情:', JSON.stringify(transformedData, null, 2));
    
    return transformedData;
  },
  
  // 转换标签格式
  transformTags(tags) {
    console.log('[home] 开始转换标签，原始标签:', tags);
    
    if (!Array.isArray(tags)) {
      console.warn('[home] 标签不是数组格式:', tags);
      return [];
    }
    
    const transformedTags = tags.map((tag, index) => {
      let text, theme;
      
      if (typeof tag === 'string') {
        text = tag;
        theme = 'primary';
      } else if (typeof tag === 'object' && tag.text) {
        text = tag.text;
        theme = tag.theme || 'primary';
      } else {
        console.warn('[home] 标签格式异常:', tag);
        text = String(tag);
        theme = 'primary';
      }
      
      const result = { text, theme };
      console.log(`[home] 标签 ${index + 1} 转换: ${tag} -> ${JSON.stringify(result)}`);
      return result;
    });
    
    console.log('[home] 标签转换完成:', transformedTags);
    return transformedTags;
  },
  
  // 转换轮播图数据格式
  transformSwiperData(rawData) {
    console.log('[home] 开始转换轮播图数据，原始数据:', rawData);
    
    if (!Array.isArray(rawData)) {
      console.warn('[home] 轮播图数据不是数组格式:', rawData);
      return [];
    }
    
    const transformedData = rawData.map((item, index) => {
      console.log(`[home] 转换轮播图第 ${index + 1} 条数据:`, item);
      
      // t-swiper 组件期望的格式
      const transformed = {
        image: item.image || item.url || '',
        title: item.title || item.desc || '精彩内容',
        link: item.link || '',
        sort: item.sort || index + 1,
        // 保留额外信息
        contentId: item.contentId,
        authorId: item.authorId,
        likeCount: item.likeCount || 0
      };
      
      console.log(`[home] 轮播图第 ${index + 1} 条转换结果:`, transformed);
      return transformed;
    });
    
    console.log('[home] 轮播图数据转换完成:', transformedData);
    return transformedData;
  },
  
  // 初始化轮播图数据
  async initSwipers() {
    console.log('[home] 开始初始化轮播图数据');
    
    // 检查管理员权限
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }
    
    try {
      const result = await cloudRequest({
        name: 'home',
        data: {
          type: 'insertSwipers'
        }
      });
      
      console.log('[home] 轮播图初始化结果:', result);
      
      if (result.code === 0) {
        wx.showToast({
          title: '轮播图初始化成功',
          icon: 'success'
        });
        
        // 重新加载数据
        await this.loadData();
      } else {
        console.warn('[home] 轮播图初始化失败:', result);
        wx.showToast({
          title: '初始化失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[home] 轮播图初始化错误:', error);
      wx.showToast({
        title: '初始化失败',
        icon: 'none'
      });
    }
  },
  
  // 初始化测试数据
  async initTestData() {
    console.log('[home] 开始初始化测试数据');
    
    // 检查管理员权限
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      });
      return;
    }
    
    try {
      const result = await cloudRequest({
        name: 'content',
        data: {
          type: 'initTestData'
        }
      });
      
      console.log('[home] 测试数据初始化结果:', result);
      
      if (result.code === 0) {
        wx.showToast({
          title: `测试数据初始化成功，插入了 ${result.data.insertedCount} 条数据`,
          icon: 'success',
          duration: 3000
        });
        
        // 重新加载数据
        await this.loadData();
      } else {
        console.warn('[home] 测试数据初始化失败:', result);
        wx.showToast({
          title: result.msg || '初始化失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('[home] 测试数据初始化错误:', error);
      wx.showToast({
        title: '初始化失败',
        icon: 'none'
      });
    }
  },
  
  // 加载数据
  async loadData() {
    console.log('[home] ========== 开始加载数据 ==========');
    
    try {
      console.log('[home] 步骤1: 准备调用云函数获取卡片数据');
      
      // 获取卡片数据
      const cardRequestData = {
        type: 'getCards',
        flowType: 'recommend', // 改为 flowType，避免与云函数操作类型冲突
        page: 1,
        pageSize: 19
      };
      console.log('[home] 卡片数据请求参数:', cardRequestData);
      
      const cardRes = await cloudRequest({
        name: 'home',
        data: cardRequestData
      });
      
      console.log('[home] 步骤1完成: 云函数返回原始卡片数据');
      console.log('[home] 卡片数据响应结构:', {
        code: cardRes.code,
        msg: cardRes.msg,
        hasData: !!cardRes.data,
        dataType: typeof cardRes.data,
        listLength: cardRes.data?.list?.length || 0
      });
      console.log('[home] 原始卡片数据详情:', JSON.stringify(cardRes, null, 2));
      
      // 转换数据格式
      console.log('[home] 步骤2: 开始转换卡片数据格式');
      const rawList = cardRes.data?.list || [];
      console.log('[home] 原始列表数据:', rawList);
      
      const transformedCards = this.transformCardData(rawList);
      console.log('[home] 步骤2完成: 卡片数据转换完成');
      
      // 获取轮播图数据
      console.log('[home] 步骤3: 准备调用云函数获取轮播图数据');
      const swiperRequestData = {
        type: 'getSwipers'
      };
      console.log('[home] 轮播图请求参数:', swiperRequestData);
      
      const swiperRes = await cloudRequest({
        name: 'home',
        data: swiperRequestData
      });
      
      console.log('[home] 步骤3完成: 轮播图数据获取完成');
      console.log('[home] 轮播图响应结构:', {
        code: swiperRes.code,
        msg: swiperRes.msg,
        hasData: !!swiperRes.data,
        dataType: typeof swiperRes.data,
        dataLength: Array.isArray(swiperRes.data) ? swiperRes.data.length : 'not array'
      });
      console.log('[home] 原始轮播图数据详情:', JSON.stringify(swiperRes, null, 2));
      
      // 转换轮播图数据
      console.log('[home] 步骤3.5: 开始转换轮播图数据格式');
      const rawSwiperList = swiperRes.data || [];
      const transformedSwipers = this.transformSwiperData(rawSwiperList);
      console.log('[home] 步骤3.5完成: 轮播图数据转换完成');
      
      // 设置数据到页面
      console.log('[home] 步骤4: 开始设置数据到页面');
      const setDataObj = {
        cardInfo: transformedCards,
        focusCardInfo: transformedCards.slice(0, 3),
        swiperList: transformedSwipers,
      };
      
      console.log('[home] 准备设置的数据:', {
        cardInfoLength: setDataObj.cardInfo.length,
        focusCardInfoLength: setDataObj.focusCardInfo.length,
        swiperListLength: setDataObj.swiperList.length
      });
      
      this.setData(setDataObj);
      
      console.log('[home] 步骤4完成: 数据设置完成');
      console.log('[home] 当前页面数据状态:', {
        cardInfo: this.data.cardInfo,
        focusCardInfo: this.data.focusCardInfo,
        swiperList: this.data.swiperList
      });
      
      console.log('[home] ========== 数据加载完成 ==========');
      
    } catch (error) {
      console.error('[home] ========== 数据加载失败 ==========');
      console.error('[home] 错误类型:', error.constructor.name);
      console.error('[home] 错误消息:', error.message);
      console.error('[home] 错误堆栈:', error.stack);
      console.error('[home] 完整错误对象:', error);
      
      // 显示用户友好的错误提示
      let errorMsg = '数据加载失败';
      if (error.code === -1) {
        errorMsg = error.msg || '云函数执行失败';
      } else if (error.errMsg) {
        errorMsg = error.errMsg;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      });
      
      console.error('[home] ========== 错误处理完成 ==========');
    }
  },
  
  // 轮播图点击事件
  onSwiperClick(e) {
    console.log('[home] 轮播图点击事件:', e);
    const { index } = e.detail;
    const swiperItem = this.data.swiperList[index];
    
    console.log('[home] 点击的轮播图项:', swiperItem);
    
    if (swiperItem && swiperItem.contentId) {
      // 跳转到内容详情页
      wx.navigateTo({
        url: `/pages/detail/index?id=${swiperItem.contentId}`,
        fail: (error) => {
          console.error('[home] 跳转详情页失败:', error);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.warn('[home] 轮播图项缺少contentId:', swiperItem);
    }
  },
  
  showOperMsg(content) {
    console.log('[home] 显示操作消息:', content);
    Message.success({
      context: this,
      offset: [120, 32],
      duration: 4000,
      content,
    });
  },
  goRelease() {
    console.log('[home] 跳转到发布页面');
    wx.navigateTo({
      url: '/pages/release/index',
    });
  },
  /**
   * 跳转到内容详情页
   * @param {Object} e - 事件对象，包含 dataset.id
   */
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('[home] goDetail 被触发，准备跳转详情页，参数 id:', id);
    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`,
      success: () => {
        console.log(`[home] 成功跳转到详情页，id: ${id}`);
      },
      fail: (error) => {
        console.error('[home] 跳转详情页失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
});
