// app.js
import config from './config';
import Mock from './mock/index';
import createBus from './utils/eventBus';
import { connectSocket, fetchUnreadNum } from './mock/chat';
import { setupGlobalErrorHandler, showError } from './utils/errorHandler';
import { logger, performanceLogger } from './utils/logger';
import { networkUtils, offlineManager } from './utils/network';
import { cacheManager } from './utils/cache';

// 初始化Mock数据（仅在开发环境）
if (config.isMock) {
  Mock();
  logger.info('🚀 开发环境：已启用Mock数据', {}, 'App');
  console.log('🚀 开发环境：已启用Mock数据');
}

App({
  onLaunch() {
    const startTime = Date.now();
    
    logger.info('🚀 小程序启动', {
      env: config.isMock ? '开发环境' : '生产环境',
      cloudEnv: config.cloudEnv,
      version: '1.0.0'
    }, 'App');
    
    console.log('🚀 小程序启动');
    console.log('📱 当前环境:', config.isMock ? '开发环境' : '生产环境');
    
    // 初始化云开发
    this.initCloud();
    
    // 初始化网络监控
    this.initNetworkMonitor();
    
    // 初始化缓存系统
    this.initCacheSystem();
    
    // 设置全局错误处理
    setupGlobalErrorHandler();
    
    // 检查更新
    this.checkUpdate();
    
    // 初始化数据
    this.initData();
    
    // 记录启动时间
    const launchTime = Date.now() - startTime;
    performanceLogger.pageLoad('app_launch', launchTime);
    
    logger.info('✅ 小程序初始化完成', { launchTime }, 'App');
  },

  // 初始化云开发
  initCloud() {
    if (wx.cloud) {
      logger.info('=== 云环境配置调试 ===', {
        env: config.isMock ? '开发环境' : '生产环境',
        cloudEnv: config.cloudEnv,
        SDKVersion: wx.getSystemInfoSync().SDKVersion
      }, 'Cloud');
      
      console.log('=== 云环境配置调试 ===');
      console.log('当前环境:', config.isMock ? '开发环境' : '生产环境');
      console.log('云环境ID:', config.cloudEnv);
      console.log('基础库版本:', wx.getSystemInfoSync().SDKVersion);
      
      wx.cloud.init({
        env: config.cloudEnv || 'cloud1-6gjcqmld5d653514',
        traceUser: true,
      });
      logger.info('☁️ 云开发初始化成功', { env: config.cloudEnv }, 'Cloud');
      console.log('☁️ 云开发初始化成功');
    } else {
      const error = new Error('请使用 2.2.3 或以上的基础库以使用云能力');
      logger.error('云开发初始化失败', error, 'Cloud');
      showError(error);
    }
  },

  // 初始化网络监控
  initNetworkMonitor() {
    try {
      // 获取初始网络状态
      const networkStatus = networkUtils.getStatus();
      logger.info('🌐 网络状态初始化', networkStatus, 'Network');
      
      // 添加网络状态监听器
      this.networkListener = networkUtils.addListener((event) => {
        if (event.type === 'offline') {
          logger.warn('网络连接断开', event, 'Network');
          wx.showToast({
            title: '网络连接断开',
            icon: 'none',
            duration: 2000
          });
        } else if (event.type === 'online') {
          logger.info('网络连接恢复', event, 'Network');
          wx.showToast({
            title: '网络连接恢复',
            icon: 'success',
            duration: 1500
          });
          
          // 网络恢复时执行离线任务
          this.executeOfflineTasks();
        }
      });
      
      console.log('🌐 网络状态:', networkStatus.networkType, networkStatus.isOnline);
    } catch (error) {
      logger.error('网络监控初始化失败', error, 'Network');
    }
  },

  // 初始化缓存系统
  initCacheSystem() {
    try {
      // 设置缓存配置
      cacheManager.setConfig({
        memory: {
          maxSize: 100,
          defaultTTL: 300000,
          cleanupInterval: 60000
        },
        storage: {
          prefix: 'app_cache_',
          maxSize: 50,
          defaultTTL: 1800000,
          cleanupInterval: 300000
        }
      });
      
      // 获取缓存统计
      const stats = cacheManager.getStats();
      logger.info('💾 缓存系统初始化', stats, 'Cache');
      
      console.log('💾 缓存统计:', stats);
    } catch (error) {
      logger.error('缓存系统初始化失败', error, 'Cache');
    }
  },

  // 检查更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      logger.info('📦 检查更新结果', { hasUpdate: res.hasUpdate }, 'App');
      console.log('📦 检查更新结果:', res.hasUpdate ? '有新版本' : '已是最新版本');
    });

    updateManager.onUpdateReady(() => {
      logger.info('📦 新版本已准备就绪', {}, 'App');
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    updateManager.onUpdateFailed(() => {
      const error = new Error('新版本下载失败，请检查网络后重试');
      logger.error('新版本下载失败', error, 'App');
      showError(error);
    });
  },

  // 初始化数据
  async initData() {
    try {
      // 获取未读消息数
      await this.getUnreadNum();
      
      // 连接WebSocket
      this.connect();
      
      logger.info('✅ 数据初始化完成', {}, 'App');
      console.log('✅ 数据初始化完成');
    } catch (error) {
      logger.error('❌ 数据初始化失败', error, 'App');
      console.error('❌ 数据初始化失败:', error);
      showError(error);
    }
  },

  // 执行离线任务
  async executeOfflineTasks() {
    try {
      const queueStatus = offlineManager.getQueueStatus();
      if (queueStatus.length > 0) {
        logger.info('🔄 执行离线任务', queueStatus, 'Offline');
        await offlineManager.executeTasks();
      }
    } catch (error) {
      logger.error('执行离线任务失败', error, 'Offline');
    }
  },

  // 清理内存
  cleanupMemory() {
    try {
      // 清理内存缓存
      cacheManager.memory.clear();
      
      // 清理日志队列
      logger.flush();
      
      logger.info('🧹 内存清理完成', {}, 'App');
    } catch (error) {
      logger.error('内存清理失败', error, 'App');
    }
  },

  globalData: {
    userInfo: null,
    unreadNum: 0, // 未读消息数量
    socket: null, // SocketTask 对象
    appVersion: '1.0.0', // 应用版本
    systemInfo: null, // 系统信息
  },

  /** 全局事件总线 */
  eventBus: createBus(),

  /** 初始化WebSocket */
  connect() {
    try {
      const socket = connectSocket();
      socket.onMessage((data) => {
        try {
          data = JSON.parse(data);
          if (data.type === 'message' && !data.data.message.read) {
            this.setUnreadNum(this.globalData.unreadNum + 1);
          }
        } catch (error) {
          logger.error('WebSocket消息解析失败', error, 'WebSocket');
          console.error('WebSocket消息解析失败:', error);
        }
      });
      
      socket.onError((error) => {
        logger.error('WebSocket连接错误', error, 'WebSocket');
        console.error('WebSocket连接错误:', error);
        showError(new Error('消息服务连接失败'));
      });
      
      socket.onClose(() => {
        logger.info('WebSocket连接已关闭', {}, 'WebSocket');
        console.log('WebSocket连接已关闭');
      });
      
      this.globalData.socket = socket;
      logger.info('🔌 WebSocket连接成功', {}, 'WebSocket');
      console.log('🔌 WebSocket连接成功');
    } catch (error) {
      logger.error('WebSocket连接失败', error, 'WebSocket');
      console.error('WebSocket连接失败:', error);
      showError(error);
    }
  },

  /** 获取未读消息数量 */
  async getUnreadNum() {
    try {
      const { data } = await fetchUnreadNum();
      this.globalData.unreadNum = data;
      this.eventBus.emit('unread-num-change', data);
      logger.info('📨 未读消息数', { count: data }, 'Message');
      console.log('📨 未读消息数:', data);
    } catch (error) {
      logger.error('获取未读消息数失败', error, 'Message');
      console.error('获取未读消息数失败:', error);
      // 不显示错误提示，避免影响用户体验
    }
  },

  /** 设置未读消息数量 */
  setUnreadNum(unreadNum) {
    this.globalData.unreadNum = unreadNum;
    this.eventBus.emit('unread-num-change', unreadNum);
  },

  /** 获取系统信息 */
  getSystemInfo() {
    if (!this.globalData.systemInfo) {
      this.globalData.systemInfo = wx.getSystemInfoSync();
    }
    return this.globalData.systemInfo;
  },

  /** 检查网络状态 */
  checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          const isConnected = res.networkType !== 'none';
          logger.info('🌐 网络状态检查', { 
            networkType: res.networkType, 
            isConnected 
          }, 'Network');
          console.log('🌐 网络状态:', res.networkType, isConnected ? '已连接' : '未连接');
          resolve({ isConnected, networkType: res.networkType });
        },
        fail: () => {
          logger.warn('网络状态检查失败', {}, 'Network');
          resolve({ isConnected: false, networkType: 'unknown' });
        }
      });
    });
  },

  /** 显示加载提示 */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  /** 隐藏加载提示 */
  hideLoading() {
    wx.hideLoading();
  },

  /** 全局错误处理 */
  onError(error) {
    logger.error('🚨 全局错误', error, 'App');
    console.error('🚨 全局错误:', error);
    // 错误上报逻辑可以在这里添加
  },

  /** 全局未处理的Promise拒绝 */
  onUnhandledRejection(res) {
    logger.error('🚨 未处理的Promise拒绝', res.reason, 'App');
    console.error('🚨 未处理的Promise拒绝:', res.reason);
    showError(res.reason);
  },

  /** 获取应用信息 */
  getAppInfo() {
    return {
      env: config.isMock ? '开发环境' : '生产环境',
      cloudEnv: config.cloudEnv,
      version: '1.0.0',
      networkStatus: networkUtils.getStatus(),
      cacheStats: cacheManager.getStats(),
      networkStats: networkUtils.getStats()
    };
  },

  /** 清理所有数据 */
  clearAllData() {
    try {
      // 清理缓存
      cacheManager.smart.clear();
      
      // 清理离线队列
      offlineManager.clearQueue();
      
      // 清理本地存储
      wx.clearStorageSync();
      
      logger.info('🗑️ 所有数据清理完成', {}, 'App');
      
      wx.showToast({
        title: '数据清理完成',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      logger.error('数据清理失败', error, 'App');
      wx.showToast({
        title: '数据清理失败',
        icon: 'error',
        duration: 2000
      });
    }
  }
});
