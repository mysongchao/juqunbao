/**
 * 网络状态监控系统
 * 支持网络状态检测、连接质量监控和离线处理
 */

import { logger } from './logger';

// 网络状态枚举
export const NETWORK_STATUS = {
  UNKNOWN: 'unknown',
  WIFI: 'wifi',
  '2G': '2g',
  '3G': '3g',
  '4G': '4g',
  '5G': '5g',
  NONE: 'none'
};

// 网络质量等级
export const NETWORK_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  POOR: 'poor',
  BAD: 'bad'
};

// 网络配置
const NETWORK_CONFIG = {
  // 检测间隔（毫秒）
  checkInterval: 10000, // 增加到10秒，减少频繁检测
  
  // 连接超时时间（毫秒）
  timeout: 10000,
  
  // 重试次数
  retryTimes: 3,
  
  // 网络质量阈值
  qualityThresholds: {
    excellent: 100,  // 延迟 < 100ms
    good: 300,       // 延迟 < 300ms
    poor: 1000,      // 延迟 < 1000ms
    bad: Infinity    // 延迟 >= 1000ms
  },
  
  // 日志配置
  logging: {
    enableStatusChangeLog: true,    // 是否记录状态变化日志
    enableQualityLog: false,        // 是否记录质量检测日志
    enableConnectionTestLog: false  // 是否记录连接测试日志
  }
};

// 网络状态类
class NetworkMonitor {
  constructor() {
    this.currentStatus = NETWORK_STATUS.UNKNOWN;
    this.currentQuality = NETWORK_QUALITY.GOOD;
    this.isOnline = true;
    this.listeners = [];
    this.checkTimer = null;
    this.connectionHistory = [];
    this.maxHistorySize = 50;
    
    this.init();
  }

  // 初始化
  init() {
    this.checkNetworkStatus();
    this.startMonitoring();
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.handleNetworkChange(res);
    });

    // 监听网络状态变化（新版本）
    if (wx.onNetworkStatusChange) {
      wx.onNetworkStatusChange((res) => {
        this.handleNetworkChange(res);
      });
    }
  }

  // 处理网络状态变化
  handleNetworkChange(res) {
    const oldStatus = this.currentStatus;
    const oldIsOnline = this.isOnline;
    
    this.currentStatus = res.networkType;
    this.isOnline = res.isConnected;
    
    // 只在状态真正发生变化时记录日志
    if ((oldStatus !== this.currentStatus || oldIsOnline !== this.isOnline) && 
        NETWORK_CONFIG.logging.enableStatusChangeLog) {
      logger.info('网络状态变化', {
        oldStatus,
        newStatus: this.currentStatus,
        oldIsOnline,
        newIsOnline: this.isOnline
      }, 'Network');
    }

    // 记录连接历史
    this.recordConnection({
      timestamp: Date.now(),
      status: this.currentStatus,
      isOnline: this.isOnline,
      quality: this.currentQuality
    });

    // 通知监听器
    this.notifyListeners({
      type: 'statusChange',
      oldStatus,
      newStatus: this.currentStatus,
      oldIsOnline,
      newIsOnline: this.isOnline
    });

    // 如果网络断开，触发离线处理
    if (!this.isOnline) {
      this.handleOffline();
    } else if (oldIsOnline !== this.isOnline) {
      this.handleOnline();
    }
  }

  // 检查网络状态
  async checkNetworkStatus() {
    try {
      const res = await this.getNetworkType();
      this.handleNetworkChange(res);
    } catch (error) {
      logger.error('检查网络状态失败', error, 'Network');
    }
  }

  // 获取网络类型
  getNetworkType() {
    return new Promise((resolve, reject) => {
      wx.getNetworkType({
        success: resolve,
        fail: reject
      });
    });
  }

  // 开始监控
  startMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(() => {
      this.checkNetworkStatus();
    }, NETWORK_CONFIG.checkInterval);
  }

  // 停止监控
  stopMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  // 测试网络连接
  async testConnection(url = 'https://www.baidu.com') {
    const startTime = Date.now();
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method: 'HEAD',
          timeout: NETWORK_CONFIG.timeout,
          success: resolve,
          fail: reject
        });
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // 评估网络质量
      this.currentQuality = this.evaluateQuality(latency);
      
      // 只在启用质量日志时记录
      if (NETWORK_CONFIG.logging.enableQualityLog) {
        logger.info('网络质量检测', {
          latency,
          quality: this.currentQuality,
          statusCode: response.statusCode
        }, 'Network');
      }
      
      return {
        success: true,
        latency,
        quality: this.currentQuality,
        statusCode: response.statusCode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: null,
        quality: NETWORK_QUALITY.BAD
      };
    }
  }

  // 评估网络质量
  evaluateQuality(latency) {
    if (latency <= NETWORK_CONFIG.qualityThresholds.excellent) {
      return NETWORK_QUALITY.EXCELLENT;
    } else if (latency <= NETWORK_CONFIG.qualityThresholds.good) {
      return NETWORK_QUALITY.GOOD;
    } else if (latency <= NETWORK_CONFIG.qualityThresholds.poor) {
      return NETWORK_QUALITY.POOR;
    } else {
      return NETWORK_QUALITY.BAD;
    }
  }

  // 记录连接历史
  recordConnection(record) {
    this.connectionHistory.push(record);
    
    // 限制历史记录大小
    if (this.connectionHistory.length > this.maxHistorySize) {
      this.connectionHistory.shift();
    }
  }

  // 处理离线状态
  handleOffline() {
    // 只有在真正离线时才记录警告
    if (this.currentStatus !== NETWORK_STATUS.NONE) {
      logger.info('网络状态变化', {
        status: this.currentStatus,
        quality: this.currentQuality,
        type: 'status_change'
      }, 'Network');
    } else {
      logger.warn('网络连接断开', {
        status: this.currentStatus,
        quality: this.currentQuality
      }, 'Network');
    }

    // 通知监听器
    this.notifyListeners({
      type: 'offline',
      status: this.currentStatus
    });

    // 可以在这里添加离线处理逻辑
    // 例如：暂停数据同步、显示离线提示等
  }

  // 处理在线状态
  handleOnline() {
    logger.info('网络连接恢复', {
      status: this.currentStatus,
      quality: this.currentQuality
    }, 'Network');

    // 通知监听器
    this.notifyListeners({
      type: 'online',
      status: this.currentStatus
    });

    // 可以在这里添加在线处理逻辑
    // 例如：恢复数据同步、清除离线提示等
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
    
    // 返回移除函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知监听器
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        logger.error('网络监听器执行失败', error, 'Network');
      }
    });
  }

  // 获取当前状态
  getStatus() {
    return {
      status: this.currentStatus,
      quality: this.currentQuality,
      isOnline: this.isOnline,
      timestamp: Date.now()
    };
  }

  // 获取连接历史
  getHistory() {
    return [...this.connectionHistory];
  }

  // 获取网络统计
  getStats() {
    const total = this.connectionHistory.length;
    const online = this.connectionHistory.filter(record => record.isOnline).length;
    const offline = total - online;
    
    const qualityStats = {};
    Object.values(NETWORK_QUALITY).forEach(quality => {
      qualityStats[quality] = this.connectionHistory.filter(record => record.quality === quality).length;
    });

    return {
      total,
      online,
      offline,
      onlineRate: total > 0 ? (online / total * 100).toFixed(2) + '%' : '0%',
      qualityStats,
      currentStatus: this.getStatus()
    };
  }

  // 设置配置
  setConfig(config) {
    Object.assign(NETWORK_CONFIG, config);
  }

  // 获取配置
  getConfig() {
    return { ...NETWORK_CONFIG };
  }
}

// 创建网络监控实例
const networkMonitor = new NetworkMonitor();

// 网络工具类
export const networkUtils = {
  // 获取网络状态
  getStatus: () => networkMonitor.getStatus(),
  
  // 测试连接
  testConnection: (url) => networkMonitor.testConnection(url),
  
  // 添加监听器
  addListener: (callback) => networkMonitor.addListener(callback),
  
  // 获取统计信息
  getStats: () => networkMonitor.getStats(),
  
  // 获取连接历史
  getHistory: () => networkMonitor.getHistory(),
  
  // 设置配置
  setConfig: (config) => networkMonitor.setConfig(config),
  
  // 获取配置
  getConfig: () => networkMonitor.getConfig(),
  
  // 检查是否在线
  isOnline: () => networkMonitor.isOnline,
  
  // 检查网络类型
  isWifi: () => networkMonitor.currentStatus === NETWORK_STATUS.WIFI,
  
  // 检查网络质量
  isGoodQuality: () => {
    const quality = networkMonitor.currentQuality;
    return quality === NETWORK_QUALITY.EXCELLENT || quality === NETWORK_QUALITY.GOOD;
  }
};

// 网络请求包装器
export const networkRequest = (options) => {
  return new Promise((resolve, reject) => {
    // 检查网络状态
    if (!networkMonitor.isOnline) {
      reject(new Error('网络连接不可用'));
      return;
    }

    const startTime = Date.now();
    
    wx.request({
      ...options,
      success: (res) => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        // 记录网络性能
        logger.info('网络请求完成', {
          url: options.url,
          method: options.method,
          latency,
          statusCode: res.statusCode
        }, 'Network');
        
        resolve(res);
      },
      fail: (error) => {
        logger.error('网络请求失败', {
          url: options.url,
          method: options.method,
          error: error.message
        }, 'Network');
        
        reject(error);
      }
    });
  });
};

// 离线数据管理器
export const offlineManager = {
  // 离线队列
  queue: [],
  
  // 添加离线任务
  addTask: (task) => {
    offlineManager.queue.push({
      ...task,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // 保存到本地存储
    wx.setStorageSync('offline_queue', offlineManager.queue);
  },
  
  // 执行离线任务
  executeTasks: async () => {
    if (!networkMonitor.isOnline || offlineManager.queue.length === 0) {
      return;
    }
    
    const tasks = [...offlineManager.queue];
    offlineManager.queue = [];
    
    for (const task of tasks) {
      try {
        await task.execute();
        logger.info('离线任务执行成功', { taskId: task.id }, 'Offline');
      } catch (error) {
        task.retryCount++;
        
        // 重试次数未超过限制，重新加入队列
        if (task.retryCount < NETWORK_CONFIG.retryTimes) {
          offlineManager.queue.push(task);
        } else {
          logger.error('离线任务执行失败', { taskId: task.id, error }, 'Offline');
        }
      }
    }
    
    // 更新本地存储
    wx.setStorageSync('offline_queue', offlineManager.queue);
  },
  
  // 获取队列状态
  getQueueStatus: () => ({
    length: offlineManager.queue.length,
    tasks: offlineManager.queue
  }),
  
  // 清空队列
  clearQueue: () => {
    offlineManager.queue = [];
    wx.removeStorageSync('offline_queue');
  }
};

// 默认导出
export default networkUtils; 