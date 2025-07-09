/**
 * 统一日志系统
 * 支持不同级别的日志记录、上报和格式化
 */

// 日志级别
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// 日志级别名称
export const LOG_LEVEL_NAMES = {
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERROR',
  [LOG_LEVELS.FATAL]: 'FATAL'
};

// 日志级别颜色
export const LOG_COLORS = {
  [LOG_LEVELS.DEBUG]: '#666666',
  [LOG_LEVELS.INFO]: '#2196F3',
  [LOG_LEVELS.WARN]: '#FF9800',
  [LOG_LEVELS.ERROR]: '#F44336',
  [LOG_LEVELS.FATAL]: '#9C27B0'
};

// 日志配置
const LOG_CONFIG = {
  level: LOG_LEVELS.INFO, // 默认日志级别
  enableConsole: true,    // 是否输出到控制台
  enableStorage: false,   // 是否保存到本地存储
  enableReport: true,     // 是否上报到服务器
  maxStorageSize: 1000,   // 本地存储最大条数
  reportInterval: 5000,   // 上报间隔（毫秒）
  reportBatchSize: 50     // 批量上报大小
};

// 日志队列
let logQueue = [];
let reportTimer = null;

// 获取当前时间戳
const getTimestamp = () => {
  return new Date().toISOString();
};

// 获取系统信息
const getSystemInfo = () => {
  try {
    return wx.getSystemInfoSync();
  } catch (error) {
    return {};
  }
};

// 格式化日志消息
const formatLogMessage = (level, message, data = null, context = '') => {
  const timestamp = getTimestamp();
  const systemInfo = getSystemInfo();
  
  return {
    level,
    levelName: LOG_LEVEL_NAMES[level],
    message: typeof message === 'string' ? message : JSON.stringify(message),
    data,
    context,
    timestamp,
    systemInfo: {
      platform: systemInfo.platform,
      system: systemInfo.system,
      version: systemInfo.version,
      SDKVersion: systemInfo.SDKVersion
    },
    userInfo: wx.getStorageSync('userInfo') || null
  };
};

// 控制台输出
const outputToConsole = (logEntry) => {
  if (!LOG_CONFIG.enableConsole) return;
  
  const { level, levelName, message, data, context, timestamp } = logEntry;
  const color = LOG_COLORS[level];
  const prefix = `[${levelName}]`;
  
  if (level >= LOG_LEVELS.ERROR) {
    console.error(`%c${prefix} ${timestamp} ${context}`, `color: ${color}`, message, data || '');
  } else if (level >= LOG_LEVELS.WARN) {
    console.warn(`%c${prefix} ${timestamp} ${context}`, `color: ${color}`, message, data || '');
  } else {
    console.log(`%c${prefix} ${timestamp} ${context}`, `color: ${color}`, message, data || '');
  }
};

// 保存到本地存储
const saveToStorage = (logEntry) => {
  if (!LOG_CONFIG.enableStorage) return;
  
  try {
    const logs = wx.getStorageSync('app_logs') || [];
    logs.push(logEntry);
    
    // 限制存储大小
    if (logs.length > LOG_CONFIG.maxStorageSize) {
      logs.splice(0, logs.length - LOG_CONFIG.maxStorageSize);
    }
    
    wx.setStorageSync('app_logs', logs);
  } catch (error) {
    console.error('保存日志失败:', error);
  }
};

// 上报到服务器
const reportToServer = (logEntry) => {
  if (!LOG_CONFIG.enableReport) return;
  
  logQueue.push(logEntry);
  
  // 批量上报
  if (logQueue.length >= LOG_CONFIG.reportBatchSize) {
    flushLogQueue();
  } else if (!reportTimer) {
    // 定时上报
    reportTimer = setTimeout(flushLogQueue, LOG_CONFIG.reportInterval);
  }
};

// 清空日志队列
const flushLogQueue = async () => {
  if (logQueue.length === 0) return;
  
  const logsToReport = [...logQueue];
  logQueue = [];
  
  if (reportTimer) {
    clearTimeout(reportTimer);
    reportTimer = null;
  }
  
  try {
    // 这里可以集成具体的日志上报服务
    // 例如：Sentry、Bugly、自建日志服务等
    console.log('📊 上报日志:', logsToReport.length, '条');
    
    // 示例：上报到云函数
    // await wx.cloud.callFunction({
    //   name: 'reportLogs',
    //   data: { logs: logsToReport }
    // });
    
  } catch (error) {
    console.error('日志上报失败:', error);
    // 失败时重新加入队列
    logQueue.unshift(...logsToReport);
  }
};

// 主日志函数
const log = (level, message, data = null, context = '') => {
  if (level < LOG_CONFIG.level) return;
  
  const logEntry = formatLogMessage(level, message, data, context);
  
  outputToConsole(logEntry);
  saveToStorage(logEntry);
  reportToServer(logEntry);
};

// 导出日志方法
export const logger = {
  debug: (message, data = null, context = '') => log(LOG_LEVELS.DEBUG, message, data, context),
  info: (message, data = null, context = '') => log(LOG_LEVELS.INFO, message, data, context),
  warn: (message, data = null, context = '') => log(LOG_LEVELS.WARN, message, data, context),
  error: (message, data = null, context = '') => log(LOG_LEVELS.ERROR, message, data, context),
  fatal: (message, data = null, context = '') => log(LOG_LEVELS.FATAL, message, data, context),
  
  // 设置日志级别
  setLevel: (level) => {
    LOG_CONFIG.level = level;
  },
  
  // 设置配置
  setConfig: (config) => {
    Object.assign(LOG_CONFIG, config);
  },
  
  // 获取配置
  getConfig: () => ({ ...LOG_CONFIG }),
  
  // 获取本地日志
  getLocalLogs: () => {
    try {
      return wx.getStorageSync('app_logs') || [];
    } catch (error) {
      return [];
    }
  },
  
  // 清空本地日志
  clearLocalLogs: () => {
    try {
      wx.removeStorageSync('app_logs');
    } catch (error) {
      console.error('清空日志失败:', error);
    }
  },
  
  // 强制上报
  flush: () => {
    flushLogQueue();
  }
};

// 页面性能监控
export const performanceLogger = {
  // 页面加载性能
  pageLoad: (pageName, loadTime) => {
    logger.info(`页面加载: ${pageName}`, { loadTime }, 'Performance');
  },
  
  // API调用性能
  apiCall: (apiName, duration, success) => {
    logger.info(`API调用: ${apiName}`, { duration, success }, 'Performance');
  },
  
  // 用户行为
  userAction: (action, data = {}) => {
    logger.info(`用户行为: ${action}`, data, 'UserAction');
  },
  
  // 错误监控
  error: (error, context = '') => {
    logger.error('应用错误', { error: error.message, stack: error.stack }, context);
  }
};

// 业务日志
export const businessLogger = {
  // 用户登录
  login: (userInfo) => {
    logger.info('用户登录', { userId: userInfo._id, isNewUser: userInfo.isNewUser }, 'Business');
  },
  
  // 内容发布
  publish: (content) => {
    logger.info('内容发布', { contentId: content._id, type: content.type }, 'Business');
  },
  
  // 搜索行为
  search: (keyword, resultCount) => {
    logger.info('用户搜索', { keyword, resultCount }, 'Business');
  },
  
  // 支付行为
  payment: (amount, product) => {
    logger.info('支付行为', { amount, product }, 'Business');
  }
};

// 默认导出
export default logger; 