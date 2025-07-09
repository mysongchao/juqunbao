/**
 * 智能缓存管理系统
 * 支持内存缓存、本地存储缓存和过期策略
 */

// 缓存配置
const CACHE_CONFIG = {
  // 内存缓存配置
  memory: {
    maxSize: 100,        // 最大缓存条数
    defaultTTL: 300000,  // 默认过期时间（5分钟）
    cleanupInterval: 60000 // 清理间隔（1分钟）
  },
  
  // 本地存储配置
  storage: {
    prefix: 'app_cache_', // 缓存键前缀
    maxSize: 50,          // 最大缓存条数
    defaultTTL: 1800000,  // 默认过期时间（30分钟）
    cleanupInterval: 300000 // 清理间隔（5分钟）
  }
};

// 内存缓存
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.startCleanup();
  }

  // 设置缓存
  set(key, value, ttl = CACHE_CONFIG.memory.defaultTTL) {
    const expireTime = Date.now() + ttl;
    const cacheItem = {
      value,
      expireTime,
      accessTime: Date.now(),
      accessCount: 0
    };

    this.cache.set(key, cacheItem);
    
    // 设置过期定时器
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);

    // 检查缓存大小
    this.checkSize();
  }

  // 获取缓存
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expireTime) {
      this.delete(key);
      return null;
    }

    // 更新访问信息
    item.accessTime = Date.now();
    item.accessCount++;

    return item.value;
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  // 清空缓存
  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  // 检查缓存大小
  checkSize() {
    if (this.cache.size > CACHE_CONFIG.memory.maxSize) {
      // 删除最少访问的缓存
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => {
        const aItem = a[1];
        const bItem = b[1];
        return aItem.accessCount - bItem.accessCount || aItem.accessTime - bItem.accessTime;
      });

      const toDelete = entries.slice(0, this.cache.size - CACHE_CONFIG.memory.maxSize);
      toDelete.forEach(([key]) => this.delete(key));
    }
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        this.delete(key);
      }
    }
  }

  // 开始定期清理
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.memory.cleanupInterval);
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.memory.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 本地存储缓存
class StorageCache {
  constructor() {
    this.prefix = CACHE_CONFIG.storage.prefix;
    this.startCleanup();
  }

  // 设置缓存
  set(key, value, ttl = CACHE_CONFIG.storage.defaultTTL) {
    try {
      const cacheKey = this.prefix + key;
      const cacheItem = {
        value,
        expireTime: Date.now() + ttl,
        accessTime: Date.now(),
        accessCount: 0
      };

      wx.setStorageSync(cacheKey, cacheItem);
      this.checkSize();
      return true;
    } catch (error) {
      console.error('设置存储缓存失败:', error);
      return false;
    }
  }

  // 获取缓存
  get(key) {
    try {
      const cacheKey = this.prefix + key;
      const item = wx.getStorageSync(cacheKey);
      
      if (!item) return null;

      // 检查是否过期
      if (Date.now() > item.expireTime) {
        this.delete(key);
        return null;
      }

      // 更新访问信息
      item.accessTime = Date.now();
      item.accessCount++;
      wx.setStorageSync(cacheKey, item);

      return item.value;
    } catch (error) {
      console.error('获取存储缓存失败:', error);
      return null;
    }
  }

  // 删除缓存
  delete(key) {
    try {
      const cacheKey = this.prefix + key;
      wx.removeStorageSync(cacheKey);
      return true;
    } catch (error) {
      console.error('删除存储缓存失败:', error);
      return false;
    }
  }

  // 清空缓存
  clear() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      cacheKeys.forEach(key => wx.removeStorageSync(key));
      return true;
    } catch (error) {
      console.error('清空存储缓存失败:', error);
      return false;
    }
  }

  // 检查缓存大小
  checkSize() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      
      if (cacheKeys.length > CACHE_CONFIG.storage.maxSize) {
        // 获取所有缓存项并按访问次数排序
        const cacheItems = cacheKeys.map(key => {
          const item = wx.getStorageSync(key);
          return { key, item };
        }).filter(({ item }) => item);

        cacheItems.sort((a, b) => {
          const aItem = a.item;
          const bItem = b.item;
          return aItem.accessCount - bItem.accessCount || aItem.accessTime - bItem.accessTime;
        });

        // 删除最少访问的缓存
        const toDelete = cacheItems.slice(0, cacheKeys.length - CACHE_CONFIG.storage.maxSize);
        toDelete.forEach(({ key }) => wx.removeStorageSync(key));
      }
    } catch (error) {
      console.error('检查存储缓存大小失败:', error);
    }
  }

  // 清理过期缓存
  cleanup() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      const now = Date.now();

      cacheKeys.forEach(key => {
        try {
          const item = wx.getStorageSync(key);
          if (item && now > item.expireTime) {
            wx.removeStorageSync(key);
          }
        } catch (error) {
          // 忽略单个缓存项的清理错误
        }
      });
    } catch (error) {
      console.error('清理存储缓存失败:', error);
    }
  }

  // 开始定期清理
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.storage.cleanupInterval);
  }

  // 获取缓存统计
  getStats() {
    try {
      const keys = wx.getStorageInfoSync().keys;
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      return {
        size: cacheKeys.length,
        maxSize: CACHE_CONFIG.storage.maxSize,
        keys: cacheKeys.map(key => key.replace(this.prefix, ''))
      };
    } catch (error) {
      return { size: 0, maxSize: CACHE_CONFIG.storage.maxSize, keys: [] };
    }
  }
}

// 创建缓存实例
const memoryCache = new MemoryCache();
const storageCache = new StorageCache();

// 缓存管理器
export const cacheManager = {
  // 内存缓存方法
  memory: {
    set: (key, value, ttl) => memoryCache.set(key, value, ttl),
    get: (key) => memoryCache.get(key),
    delete: (key) => memoryCache.delete(key),
    clear: () => memoryCache.clear(),
    stats: () => memoryCache.getStats()
  },

  // 存储缓存方法
  storage: {
    set: (key, value, ttl) => storageCache.set(key, value, ttl),
    get: (key) => storageCache.get(key),
    delete: (key) => storageCache.delete(key),
    clear: () => storageCache.clear(),
    stats: () => storageCache.getStats()
  },

  // 智能缓存（优先内存，后存储）
  smart: {
    set: (key, value, ttl) => {
      memoryCache.set(key, value, ttl);
      storageCache.set(key, value, ttl);
    },
    get: (key) => {
      // 先从内存获取
      let value = memoryCache.get(key);
      if (value !== null) return value;

      // 从存储获取
      value = storageCache.get(key);
      if (value !== null) {
        // 回填到内存
        memoryCache.set(key, value, CACHE_CONFIG.memory.defaultTTL);
      }
      return value;
    },
    delete: (key) => {
      memoryCache.delete(key);
      storageCache.delete(key);
    },
    clear: () => {
      memoryCache.clear();
      storageCache.clear();
    }
  },

  // 设置配置
  setConfig: (config) => {
    Object.assign(CACHE_CONFIG, config);
  },

  // 获取配置
  getConfig: () => ({ ...CACHE_CONFIG }),

  // 获取所有统计信息
  getStats: () => ({
    memory: memoryCache.getStats(),
    storage: storageCache.getStats()
  })
};

// 缓存装饰器
export const cacheDecorator = (cacheType = 'smart', ttl = null) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}_${propertyName}_${JSON.stringify(args)}`;
      const cacheTTL = ttl || (cacheType === 'memory' ? CACHE_CONFIG.memory.defaultTTL : CACHE_CONFIG.storage.defaultTTL);
      
      // 尝试从缓存获取
      let result = cacheManager[cacheType].get(cacheKey);
      if (result !== null) {
        return result;
      }

      // 执行原方法
      result = await method.apply(this, args);
      
      // 缓存结果
      cacheManager[cacheType].set(cacheKey, result, cacheTTL);
      
      return result;
    };
    
    return descriptor;
  };
};

// 预定义的缓存策略
export const cacheStrategies = {
  // API数据缓存（短期）
  apiData: {
    memory: 60000,    // 1分钟
    storage: 300000   // 5分钟
  },
  
  // 用户数据缓存（中期）
  userData: {
    memory: 300000,   // 5分钟
    storage: 1800000  // 30分钟
  },
  
  // 配置数据缓存（长期）
  configData: {
    memory: 1800000,  // 30分钟
    storage: 86400000 // 24小时
  }
};

// 默认导出
export default cacheManager; 