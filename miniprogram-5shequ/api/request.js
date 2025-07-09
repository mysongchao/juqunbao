import config from '../config';

const { baseUrl, timeout, retryTimes, isMock } = config;

// 请求队列管理
let requestQueue = [];
let isProcessing = false;

// 统一响应格式
const createResponse = (success, data, message = '', code = 0) => ({
  success,
  data,
  message,
  code,
  timestamp: Date.now()
});

// 错误码映射
const ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求地址不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
  NETWORK_ERROR: '网络连接失败',
  TIMEOUT_ERROR: '请求超时',
  UNKNOWN_ERROR: '未知错误'
};

// 获取错误信息
const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.errMsg) return error.errMsg;
  if (error.message) return error.message;
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

// 请求拦截器
const requestInterceptor = (options) => {
  const { url, method, data, header = {} } = options;
  
  // 添加通用请求头
  const finalHeader = {
    'content-type': 'application/json',
    'X-API-Version': config.apiVersion,
    'X-Request-Time': Date.now(),
    ...header
  };

  // 添加认证token
  const tokenString = wx.getStorageSync('access_token');
  if (tokenString) {
    finalHeader.Authorization = `Bearer ${tokenString}`;
  }

  return {
    ...options,
    header: finalHeader,
    timeout: timeout
  };
};

// 响应拦截器
const responseInterceptor = (response) => {
  const { statusCode, data } = response;
  
  // HTTP状态码检查
  if (statusCode !== 200) {
    throw new Error(ERROR_MESSAGES[statusCode] || `HTTP ${statusCode}`);
  }

  // 业务状态码检查
  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || data.msg || '请求失败');
  }

  return createResponse(true, data.data || data, data.message || data.msg, data.code);
};

// 重试机制
const retryRequest = async (options, retryCount = 0) => {
  try {
    return await new Promise((resolve, reject) => {
      wx.request({
        ...options,
        success: resolve,
        fail: reject
      });
    });
  } catch (error) {
    if (retryCount < retryTimes && shouldRetry(error)) {
      console.log(`请求失败，第${retryCount + 1}次重试:`, error);
      await delay(1000 * (retryCount + 1)); // 递增延迟
      return retryRequest(options, retryCount + 1);
    }
    throw error;
  }
};

// 判断是否需要重试
const shouldRetry = (error) => {
  const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 502, 503, 504];
  return retryableErrors.includes(error.errMsg) || retryableErrors.includes(error.statusCode);
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 主请求函数
async function request(url, method = 'GET', data = {}) {
  const options = requestInterceptor({
    url: baseUrl + url,
    method,
    data,
    dataType: 'json'
  });

  try {
    const response = await retryRequest(options);
    return responseInterceptor(response);
  } catch (error) {
    console.error('请求失败:', error);
    return createResponse(false, null, getErrorMessage(error), -1);
  }
}

// 云函数请求封装优化
export async function cloudRequest({ name, data = {} }) {
  const options = {
    name,
    data: {
      ...data,
      _timestamp: Date.now(),
      _version: config.apiVersion
    },
    timeout: timeout
  };

  try {
    const response = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        ...options,
        success: resolve,
        fail: reject
      });
    });

    const { result } = response;
    
    // 兼容不同的返回格式
    if (result && (result.code === 0 || result.code === 200)) {
      return createResponse(true, result.data, result.message || result.msg, result.code);
    } else {
      throw new Error(result?.message || result?.msg || '云函数调用失败');
    }
  } catch (error) {
    console.error('云函数调用失败:', error);
    return createResponse(false, null, getErrorMessage(error), -1);
  }
}

// 批量请求
export async function batchRequest(requests) {
  const results = await Promise.allSettled(requests);
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return createResponse(false, null, getErrorMessage(result.reason), -1);
    }
  });
}

// 请求队列处理
export async function queueRequest(requestFn) {
  return new Promise((resolve) => {
    requestQueue.push({ requestFn, resolve });
    processQueue();
  });
}

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  const { requestFn, resolve } = requestQueue.shift();
  
  try {
    const result = await requestFn();
    resolve(result);
  } catch (error) {
    resolve(createResponse(false, null, getErrorMessage(error), -1));
  } finally {
    isProcessing = false;
    processQueue();
  }
};

// 导出请求和服务地址
export default request;
