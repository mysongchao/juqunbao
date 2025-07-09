/**
 * 轻量级状态管理工具
 * 支持响应式数据更新、状态持久化和状态订阅
 */

import { logger } from './logger';
import cacheManager from './cache';

// 状态管理器类
class Store {
  constructor(options = {}) {
    this.state = options.state || {};
    this.subscribers = new Map();
    this.persistKeys = options.persistKeys || [];
    this.debug = options.debug || false;
    
    // 初始化持久化状态
    this.initPersistedState();
    
    // 代理state，监听变化
    this.state = this.createProxy(this.state);
  }

  // 创建代理对象，监听状态变化
  createProxy(obj, path = '') {
    const self = this;
    
    return new Proxy(obj, {
      get(target, key) {
        const value = target[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return self.createProxy(value, path ? `${path}.${key}` : key);
        }
        return value;
      },
      
      set(target, key, value) {
        const oldValue = target[key];
        target[key] = value;
        
        const fullPath = path ? `${path}.${key}` : key;
        
        // 记录状态变化
        if (self.debug) {
          logger.debug('状态变化', {
            path: fullPath,
            oldValue,
            newValue: value
          }, 'Store');
        }
        
        // 通知订阅者
        self.notifySubscribers(fullPath, value, oldValue);
        
        // 持久化状态
        if (self.persistKeys.includes(fullPath)) {
          self.persistState(fullPath, value);
        }
        
        return true;
      },
      
      deleteProperty(target, key) {
        const oldValue = target[key];
        delete target[key];
        
        const fullPath = path ? `${path}.${key}` : key;
        
        // 记录状态变化
        if (self.debug) {
          logger.debug('状态删除', {
            path: fullPath,
            oldValue
          }, 'Store');
        }
        
        // 通知订阅者
        self.notifySubscribers(fullPath, undefined, oldValue);
        
        // 清除持久化状态
        if (self.persistKeys.includes(fullPath)) {
          self.clearPersistedState(fullPath);
        }
        
        return true;
      }
    });
  }

  // 初始化持久化状态
  initPersistedState() {
    try {
      this.persistKeys.forEach(key => {
        const persistedValue = wx.getStorageSync(`store_${key}`);
        if (persistedValue !== '') {
          this.setNestedValue(this.state, key, persistedValue);
        }
      });
      
      logger.info('持久化状态初始化完成', {
        persistKeys: this.persistKeys
      }, 'Store');
    } catch (error) {
      logger.error('持久化状态初始化失败', error, 'Store');
    }
  }

  // 设置嵌套值
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // 获取嵌套值
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // 持久化状态
  persistState(key, value) {
    try {
      wx.setStorageSync(`store_${key}`, value);
    } catch (error) {
      logger.error('状态持久化失败', { key, error }, 'Store');
    }
  }

  // 清除持久化状态
  clearPersistedState(key) {
    try {
      wx.removeStorageSync(`store_${key}`);
    } catch (error) {
      logger.error('清除持久化状态失败', { key, error }, 'Store');
    }
  }

  // 订阅状态变化
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.subscribers.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  // 通知订阅者
  notifySubscribers(path, newValue, oldValue) {
    // 通知精确路径的订阅者
    const exactCallbacks = this.subscribers.get(path);
    if (exactCallbacks) {
      exactCallbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          logger.error('状态订阅回调执行失败', error, 'Store');
        }
      });
    }
    
    // 通知父路径的订阅者
    const parentPath = this.getParentPath(path);
    if (parentPath) {
      const parentCallbacks = this.subscribers.get(parentPath);
      if (parentCallbacks) {
        parentCallbacks.forEach(callback => {
          try {
            callback(this.getNestedValue(this.state, parentPath), undefined, parentPath);
          } catch (error) {
            logger.error('状态订阅回调执行失败', error, 'Store');
          }
        });
      }
    }
  }

  // 获取父路径
  getParentPath(path) {
    const parts = path.split('.');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('.');
    }
    return null;
  }

  // 获取状态
  getState(path = null) {
    if (path) {
      return this.getNestedValue(this.state, path);
    }
    return this.state;
  }

  // 设置状态
  setState(path, value) {
    this.setNestedValue(this.state, path, value);
  }

  // 批量更新状态
  batchUpdate(updates) {
    Object.keys(updates).forEach(path => {
      this.setState(path, updates[path]);
    });
  }

  // 重置状态
  resetState(path = null) {
    if (path) {
      this.setState(path, undefined);
    } else {
      this.state = {};
    }
  }

  // 获取状态快照
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // 从快照恢复状态
  restoreFromSnapshot(snapshot) {
    this.state = this.createProxy(snapshot);
  }

  // 获取订阅统计
  getSubscriptionStats() {
    const stats = {};
    this.subscribers.forEach((callbacks, path) => {
      stats[path] = callbacks.size;
    });
    return stats;
  }
}

// 创建全局状态管理器
const globalStore = new Store({
  state: {
    user: {
      info: null,
      isLoggedIn: false,
      token: null
    },
    app: {
      theme: 'light',
      language: 'zh-CN',
      networkStatus: 'unknown'
    },
    cache: {
      homeData: null,
      userData: null
    }
  },
  persistKeys: [
    'user.info',
    'user.token',
    'app.theme',
    'app.language'
  ],
  debug: true
});

// 状态管理工具
export const storeUtils = {
  // 获取状态
  getState: (path) => globalStore.getState(path),
  
  // 设置状态
  setState: (path, value) => globalStore.setState(path, value),
  
  // 批量更新
  batchUpdate: (updates) => globalStore.batchUpdate(updates),
  
  // 订阅状态变化
  subscribe: (path, callback) => globalStore.subscribe(path, callback),
  
  // 重置状态
  reset: (path) => globalStore.resetState(path),
  
  // 获取快照
  getSnapshot: () => globalStore.getSnapshot(),
  
  // 从快照恢复
  restore: (snapshot) => globalStore.restoreFromSnapshot(snapshot),
  
  // 获取统计
  getStats: () => globalStore.getSubscriptionStats()
};

// 用户状态管理
export const userStore = {
  // 获取用户信息
  getUserInfo: () => storeUtils.getState('user.info'),
  
  // 设置用户信息
  setUserInfo: (userInfo) => {
    storeUtils.setState('user.info', userInfo);
    storeUtils.setState('user.isLoggedIn', !!userInfo);
  },
  
  // 清除用户信息
  clearUserInfo: () => {
    storeUtils.setState('user.info', null);
    storeUtils.setState('user.isLoggedIn', false);
    storeUtils.setState('user.token', null);
  },
  
  // 设置登录状态
  setLoginStatus: (isLoggedIn) => {
    storeUtils.setState('user.isLoggedIn', isLoggedIn);
  },
  
  // 获取登录状态
  isLoggedIn: () => storeUtils.getState('user.isLoggedIn'),
  
  // 设置Token
  setToken: (token) => storeUtils.setState('user.token', token),
  
  // 获取Token
  getToken: () => storeUtils.getState('user.token')
};

// 应用状态管理
export const appStore = {
  // 获取主题
  getTheme: () => storeUtils.getState('app.theme'),
  
  // 设置主题
  setTheme: (theme) => storeUtils.setState('app.theme', theme),
  
  // 获取语言
  getLanguage: () => storeUtils.getState('app.language'),
  
  // 设置语言
  setLanguage: (language) => storeUtils.setState('app.language', language),
  
  // 获取网络状态
  getNetworkStatus: () => storeUtils.getState('app.networkStatus'),
  
  // 设置网络状态
  setNetworkStatus: (status) => storeUtils.setState('app.networkStatus', status)
};

// 缓存状态管理
export const cacheStore = {
  // 获取首页数据
  getHomeData: () => storeUtils.getState('cache.homeData'),
  
  // 设置首页数据
  setHomeData: (data) => storeUtils.setState('cache.homeData', data),
  
  // 获取用户数据
  getUserData: () => storeUtils.getState('cache.userData'),
  
  // 设置用户数据
  setUserData: (data) => storeUtils.setState('cache.userData', data),
  
  // 清除缓存
  clearCache: () => {
    storeUtils.setState('cache.homeData', null);
    storeUtils.setState('cache.userData', null);
  }
};

// 状态连接器（用于页面和组件）
export const connectStore = (mapStateToProps, mapDispatchToProps) => {
  return (pageConfig) => {
    const originalOnLoad = pageConfig.onLoad;
    const originalOnUnload = pageConfig.onUnload;
    const unsubscribers = [];
    
    pageConfig.onLoad = function(options) {
      // 连接状态
      if (mapStateToProps) {
        const stateProps = mapStateToProps(storeUtils.getState());
        Object.assign(this.data, stateProps);
        
        // 订阅状态变化
        Object.keys(stateProps).forEach(key => {
          const unsubscribe = storeUtils.subscribe(key, (newValue) => {
            this.setData({ [key]: newValue });
          });
          unsubscribers.push(unsubscribe);
        });
      }
      
      // 绑定dispatch
      if (mapDispatchToProps) {
        const dispatchProps = mapDispatchToProps(storeUtils);
        Object.assign(this, dispatchProps);
      }
      
      // 调用原始onLoad
      if (originalOnLoad) {
        originalOnLoad.call(this, options);
      }
    };
    
    pageConfig.onUnload = function() {
      // 取消订阅
      unsubscribers.forEach(unsubscribe => unsubscribe());
      unsubscribers.length = 0;
      
      // 调用原始onUnload
      if (originalOnUnload) {
        originalOnUnload.call(this);
      }
    };
    
    return pageConfig;
  };
};

// 默认导出
export default globalStore; 