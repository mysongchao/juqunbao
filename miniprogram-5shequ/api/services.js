import { cloudRequest, batchRequest } from './request';
import config from '../config';
import { logger, performanceLogger, businessLogger } from '../utils/logger';
import cacheManager, { cacheStrategies } from '../utils/cache';
import networkUtils, { offlineManager } from '../utils/network';

const { cloudFunctions } = config;

// 统一响应处理
const handleResponse = (response) => {
  if (response.success) {
    return response.data;
  } else {
    throw new Error(response.message);
  }
};

// API调用包装器
const apiCall = async (apiName, callFunction, cacheStrategy = null) => {
  const startTime = Date.now();
  
  try {
    // 检查网络状态
    if (!networkUtils.isOnline()) {
      throw new Error('网络连接不可用');
    }

    // 如果有缓存策略，尝试从缓存获取
    if (cacheStrategy) {
      const cacheKey = `api_${apiName}_${JSON.stringify(arguments)}`;
      const cached = cacheManager.smart.get(cacheKey);
      if (cached !== null) {
        performanceLogger.apiCall(apiName, Date.now() - startTime, true);
        logger.debug(`API缓存命中: ${apiName}`);
        return cached;
      }
    }

    // 执行API调用
    const result = await callFunction();
    
    // 记录性能
    const duration = Date.now() - startTime;
    performanceLogger.apiCall(apiName, duration, true);
    
    // 如果有缓存策略，保存到缓存
    if (cacheStrategy && result) {
      const cacheKey = `api_${apiName}_${JSON.stringify(arguments)}`;
      const ttl = cacheStrategy.memory || cacheStrategies.apiData.memory;
      cacheManager.smart.set(cacheKey, result, ttl);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceLogger.apiCall(apiName, duration, false);
    logger.error(`API调用失败: ${apiName}`, error, 'API');
    
    // 如果是网络错误，添加到离线队列
    if (error.message.includes('网络')) {
      offlineManager.addTask({
        id: `${apiName}_${Date.now()}`,
        apiName,
        execute: callFunction
      });
    }
    
    throw error;
  }
};

// 首页相关API
export const homeAPI = {
  // 获取内容卡片列表
  getCards: async (params = {}) => {
    return apiCall('home.getCards', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.home,
        data: {
          type: 'getCards',
          ...params
        }
      });
      return handleResponse(response);
    }, cacheStrategies.apiData);
  },

  // 获取轮播图
  getSwipers: async () => {
    return apiCall('home.getSwipers', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.home,
        data: { type: 'getSwipers' }
      });
      return handleResponse(response);
    }, cacheStrategies.apiData);
  }
};

// 用户相关API
export const userAPI = {
  // 获取用户openid
  getOpenId: async () => {
    return apiCall('user.getOpenId', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.user,
        data: { type: 'getOpenId' }
      });
      return handleResponse(response);
    });
  },

  // 微信登录
  wxLogin: async (userInfo) => {
    return apiCall('user.wxLogin', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.user,
        data: {
          type: 'wxLogin',
          userInfo
        }
      });
      const result = handleResponse(response);
      
      // 记录业务日志
      businessLogger.login(result);
      
      return result;
    });
  },

  // 获取用户信息
  getUserInfo: async () => {
    return apiCall('user.getUserInfo', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.user,
        data: { type: 'getUserInfo' }
      });
      return handleResponse(response);
    }, cacheStrategies.userData);
  },

  // 更新用户信息
  updateUserInfo: async (userInfo) => {
    return apiCall('user.updateUserInfo', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.user,
        data: {
          type: 'updateUserInfo',
          userInfo
        }
      });
      return handleResponse(response);
    });
  }
};

// 内容相关API
export const contentAPI = {
  // 发布内容
  publish: async (content) => {
    return apiCall('content.publish', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.content,
        data: {
          type: 'publish',
          ...content
        }
      });
      const result = handleResponse(response);
      
      // 记录业务日志
      businessLogger.publish({ _id: result._id, type: 'publish' });
      
      // 清除相关缓存
      cacheManager.smart.delete('api_home.getCards');
      cacheManager.smart.delete('api_home.getSwipers');
      
      return result;
    });
  },

  // 保存草稿
  draft: async (content) => {
    return apiCall('content.draft', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.content,
        data: {
          type: 'draft',
          ...content
        }
      });
      return handleResponse(response);
    });
  },

  // 获取内容详情
  getDetail: async (id) => {
    return apiCall('content.getDetail', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.getContentDetail,
        data: { id }
      });
      return handleResponse(response);
    }, cacheStrategies.apiData);
  }
};

// 搜索相关API
export const searchAPI = {
  // 获取搜索历史
  getHistory: async () => {
    return apiCall('search.getHistory', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.search,
        data: { type: 'getHistory' }
      });
      return handleResponse(response);
    }, cacheStrategies.userData);
  },

  // 添加搜索历史
  addHistory: async (keyword) => {
    return apiCall('search.addHistory', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.search,
        data: {
          type: 'addHistory',
          keyword
        }
      });
      return handleResponse(response);
    });
  },

  // 删除搜索历史
  deleteHistory: async (keyword) => {
    return apiCall('search.deleteHistory', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.search,
        data: {
          type: 'deleteHistory',
          keyword
        }
      });
      return handleResponse(response);
    });
  },

  // 获取热门搜索
  getPopular: async () => {
    return apiCall('search.getPopular', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.search,
        data: { type: 'getPopular' }
      });
      return handleResponse(response);
    }, cacheStrategies.configData);
  },

  // 搜索内容
  searchContent: async (keyword, page = 1, pageSize = 20) => {
    return apiCall('search.searchContent', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.search,
        data: {
          type: 'searchContent',
          keyword,
          page,
          pageSize
        }
      });
      const result = handleResponse(response);
      
      // 记录业务日志
      businessLogger.search(keyword, result.list?.length || 0);
      
      return result;
    }, cacheStrategies.apiData);
  }
};

// 上传相关API
export const uploadAPI = {
  // 上传图片
  uploadImage: async (fileID, fileName) => {
    return apiCall('upload.uploadImage', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.upload,
        data: {
          type: 'uploadImage',
          fileID,
          fileName
        }
      });
      return handleResponse(response);
    });
  },

  // 上传文件
  uploadFile: async (fileID, fileName, fileType = 'other') => {
    return apiCall('upload.uploadFile', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.upload,
        data: {
          type: 'uploadFile',
          fileID,
          fileName,
          fileType
        }
      });
      return handleResponse(response);
    });
  },

  // 删除文件
  deleteFile: async (fileID) => {
    return apiCall('upload.deleteFile', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.upload,
        data: {
          type: 'deleteFile',
          fileID
        }
      });
      return handleResponse(response);
    });
  }
};

// 消息相关API
export const messageAPI = {
  // 获取消息列表
  getList: async () => {
    return apiCall('message.getList', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.message,
        data: { type: 'getList' }
      });
      return handleResponse(response);
    }, cacheStrategies.apiData);
  },

  // 获取未读消息数
  getUnreadCount: async () => {
    return apiCall('message.getUnreadCount', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.message,
        data: { type: 'getUnreadCount' }
      });
      return handleResponse(response);
    }, cacheStrategies.apiData);
  }
};

// 标签相关API
export const tagsAPI = {
  // 获取标签列表
  getList: async () => {
    return apiCall('tags.getList', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.tags,
        data: { type: 'getList' }
      });
      return handleResponse(response);
    }, cacheStrategies.configData);
  }
};

// 内容操作API
export const contentActionsAPI = {
  // 点赞/取消点赞
  like: async (contentId, action = 'like') => {
    return apiCall('contentActions.like', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.contentActions,
        data: {
          type: 'like',
          contentId,
          action
        }
      });
      return handleResponse(response);
    });
  },

  // 收藏/取消收藏
  favorite: async (contentId, action = 'favorite') => {
    return apiCall('contentActions.favorite', async () => {
      const response = await cloudRequest({
        name: cloudFunctions.contentActions,
        data: {
          type: 'favorite',
          contentId,
          action
        }
      });
      return handleResponse(response);
    });
  }
};

// 批量API调用
export const batchAPI = {
  // 批量获取首页数据
  getHomeData: async () => {
    const startTime = Date.now();
    
    try {
      const requests = [
        homeAPI.getCards({ flowType: 'recommend', page: 1, pageSize: 10 }),
        homeAPI.getSwipers(),
        tagsAPI.getList()
      ];
      
      const results = await batchRequest(requests);
      const duration = Date.now() - startTime;
      
      performanceLogger.apiCall('batch.getHomeData', duration, true);
      
      return {
        cards: results[0].success ? results[0].data : [],
        swipers: results[1].success ? results[1].data : [],
        tags: results[2].success ? results[2].data : []
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceLogger.apiCall('batch.getHomeData', duration, false);
      throw error;
    }
  },

  // 批量获取用户数据
  getUserData: async () => {
    const startTime = Date.now();
    
    try {
      const requests = [
        userAPI.getUserInfo(),
        messageAPI.getUnreadCount()
      ];
      
      const results = await batchRequest(requests);
      const duration = Date.now() - startTime;
      
      performanceLogger.apiCall('batch.getUserData', duration, true);
      
      return {
        userInfo: results[0].success ? results[0].data : null,
        unreadCount: results[1].success ? results[1].data : 0
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceLogger.apiCall('batch.getUserData', duration, false);
      throw error;
    }
  }
};

// 缓存管理
export const cacheAPI = {
  // 清除所有缓存
  clearAll: () => {
    cacheManager.smart.clear();
    logger.info('已清除所有缓存');
  },
  
  // 清除特定API缓存
  clearAPI: (apiName) => {
    const keys = cacheManager.storage.stats().keys;
    const apiKeys = keys.filter(key => key.includes(`api_${apiName}`));
    apiKeys.forEach(key => cacheManager.smart.delete(key));
    logger.info(`已清除API缓存: ${apiName}`, { clearedKeys: apiKeys.length });
  },
  
  // 获取缓存统计
  getStats: () => {
    return cacheManager.getStats();
  }
};

// 网络管理
export const networkAPI = {
  // 获取网络状态
  getStatus: () => networkUtils.getStatus(),
  
  // 测试网络连接
  testConnection: (url) => networkUtils.testConnection(url),
  
  // 获取网络统计
  getStats: () => networkUtils.getStats(),
  
  // 添加网络监听器
  addListener: (callback) => networkUtils.addListener(callback)
};

// 离线管理
export const offlineAPI = {
  // 获取离线队列状态
  getQueueStatus: () => offlineManager.getQueueStatus(),
  
  // 执行离线任务
  executeTasks: () => offlineManager.executeTasks(),
  
  // 清空离线队列
  clearQueue: () => offlineManager.clearQueue()
};

// 导出所有API
export default {
  home: homeAPI,
  user: userAPI,
  content: contentAPI,
  search: searchAPI,
  upload: uploadAPI,
  message: messageAPI,
  tags: tagsAPI,
  contentActions: contentActionsAPI,
  batch: batchAPI,
  cache: cacheAPI,
  network: networkAPI,
  offline: offlineAPI
}; 