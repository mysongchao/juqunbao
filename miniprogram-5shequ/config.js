// 环境配置
const ENV = {
  development: {
    isMock: true,
    baseUrl: '',
    cloudEnv: 'cloud1-6gjcqmld5d653514', // 开发环境云环境ID
  },
  production: {
    isMock: false,
    baseUrl: 'https://your-api.com',
    cloudEnv: 'cloud1-6gjcqmld5d653514', // 生产环境云环境ID
  }
};

// 获取当前环境
const getCurrentEnv = () => {
  // 微信小程序环境判断
  if (typeof wx !== 'undefined') {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo.miniProgram.envVersion || 'development';
  }
  return 'development';
};

const currentEnv = getCurrentEnv();
const config = ENV[currentEnv] || ENV.development;

export default {
  ...config,
  // 通用配置
  apiVersion: 'v1',
  timeout: 10000,
  retryTimes: 3,
  // 云函数配置
  cloudFunctions: {
    home: 'home',
    user: 'user',
    content: 'content',
    search: 'search',
    upload: 'upload',
    message: 'message',
    tags: 'tags',
    contentActions: 'contentActions',
    getContentDetail: 'getContentDetail'
  }
};
