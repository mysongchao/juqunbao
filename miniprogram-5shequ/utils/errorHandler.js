// 错误类型枚举
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  BUSINESS: 'BUSINESS_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// 错误码映射
export const ERROR_CODES = {
  // 网络错误 (1000-1999)
  1000: '网络连接失败',
  1001: '请求超时',
  1002: '服务器无响应',
  1003: '网络不稳定',

  // 认证错误 (2000-2999)
  2000: '未登录',
  2001: '登录已过期',
  2002: '权限不足',
  2003: '账号被封禁',

  // 参数错误 (3000-3999)
  3000: '参数错误',
  3001: '必填参数缺失',
  3002: '参数格式错误',
  3003: '参数值无效',

  // 业务错误 (4000-4999)
  4000: '操作失败',
  4001: '数据不存在',
  4002: '数据已存在',
  4003: '状态不允许',
  4004: '余额不足',
  4005: '频率限制',

  // 系统错误 (5000-5999)
  5000: '系统错误',
  5001: '数据库错误',
  5002: '文件上传失败',
  5003: '服务暂时不可用'
};

// 错误类
export class AppError extends Error {
  constructor(message, code = 5000, type = ERROR_TYPES.UNKNOWN, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
  }

  // 转换为可序列化的对象
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// 错误工厂函数
export const createError = (code, message = null, details = null) => {
  const errorMessage = message || ERROR_CODES[code] || '未知错误';
  let type = ERROR_TYPES.UNKNOWN;

  if (code >= 1000 && code < 2000) type = ERROR_TYPES.NETWORK;
  else if (code >= 2000 && code < 3000) type = ERROR_TYPES.AUTH;
  else if (code >= 3000 && code < 4000) type = ERROR_TYPES.VALIDATION;
  else if (code >= 4000 && code < 5000) type = ERROR_TYPES.BUSINESS;

  return new AppError(errorMessage, code, type, details);
};

// 错误处理函数
export const handleError = (error, context = '') => {
  console.error(`[${context}] 错误详情:`, error);

  // 如果是AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }

  // 处理网络错误
  if (error.errMsg && error.errMsg.includes('request:fail')) {
    return createError(1000, '网络连接失败', error);
  }

  // 处理超时错误
  if (error.errMsg && error.errMsg.includes('timeout')) {
    return createError(1001, '请求超时', error);
  }

  // 处理微信API错误
  if (error.errCode) {
    switch (error.errCode) {
      case -1:
        return createError(5000, '系统错误', error);
      case 1000:
        return createError(2000, '未登录', error);
      case 1001:
        return createError(2001, '登录已过期', error);
      default:
        return createError(5000, `微信API错误: ${error.errMsg}`, error);
    }
  }

  // 处理其他错误
  return createError(5000, error.message || '未知错误', error);
};

// 错误提示函数
export const showError = (error, options = {}) => {
  const {
    title = '提示',
    duration = 2000,
    showCancel = false,
    cancelText = '取消',
    confirmText = '确定'
  } = options;

  const message = error instanceof AppError ? error.message : error.message || '操作失败';

  if (showCancel) {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content: message,
        showCancel,
        cancelText,
        confirmText,
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  } else {
    wx.showToast({
      title: message,
      icon: 'none',
      duration
    });
  }
};

// 错误上报函数
export const reportError = (error, context = '') => {
  const errorData = {
    ...error.toJSON(),
    context,
    userAgent: wx.getSystemInfoSync(),
    timestamp: Date.now()
  };

  // 这里可以集成错误上报服务，如Sentry、Bugly等
  console.error('错误上报:', errorData);

  // 示例：上报到云函数
  // wx.cloud.callFunction({
  //   name: 'reportError',
  //   data: errorData
  // });
};

// 全局错误处理器
export const setupGlobalErrorHandler = () => {
  // 处理未捕获的Promise错误
  wx.onUnhandledRejection(({ reason, promise }) => {
    const error = handleError(reason, 'UnhandledRejection');
    reportError(error, 'UnhandledRejection');
    showError(error);
  });

  // 处理未捕获的JS错误
  wx.onError((error) => {
    const appError = handleError(new Error(error), 'onError');
    reportError(appError, 'onError');
  });
};

// 异步错误包装器
export const asyncErrorHandler = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const appError = handleError(error, asyncFn.name);
      reportError(appError, asyncFn.name);
      throw appError;
    }
  };
};

// 页面错误处理装饰器
export const pageErrorHandler = (pageConfig) => {
  const originalOnLoad = pageConfig.onLoad;
  const originalOnShow = pageConfig.onShow;

  pageConfig.onLoad = function(options) {
    try {
      if (originalOnLoad) {
        originalOnLoad.call(this, options);
      }
    } catch (error) {
      const appError = handleError(error, `${this.route}.onLoad`);
      reportError(appError, `${this.route}.onLoad`);
      showError(appError);
    }
  };

  pageConfig.onShow = function() {
    try {
      if (originalOnShow) {
        originalOnShow.call(this);
      }
    } catch (error) {
      const appError = handleError(error, `${this.route}.onShow`);
      reportError(appError, `${this.route}.onShow`);
      showError(appError);
    }
  };

  return pageConfig;
};

// 导出默认错误处理配置
export default {
  ERROR_TYPES,
  ERROR_CODES,
  AppError,
  createError,
  handleError,
  showError,
  reportError,
  setupGlobalErrorHandler,
  asyncErrorHandler,
  pageErrorHandler
}; 