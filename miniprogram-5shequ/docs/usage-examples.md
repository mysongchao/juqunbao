# 微信小程序优化功能使用示例

## 目录
1. [日志系统使用](#日志系统使用)
2. [缓存管理使用](#缓存管理使用)
3. [网络监控使用](#网络监控使用)
4. [API服务使用](#api服务使用)
5. [性能监控使用](#性能监控使用)
6. [页面集成示例](#页面集成示例)
7. [最佳实践](#最佳实践)

## 日志系统使用

### 基础日志记录
```javascript
import { logger, performanceLogger, businessLogger } from '../utils/logger';

// 基础日志
logger.debug('调试信息', { userId: '123', action: 'login' }, 'Auth');
logger.info('用户登录成功', { userId: '123', loginTime: Date.now() }, 'Auth');
logger.warn('网络连接不稳定', { networkType: '3g' }, 'Network');
logger.error('API调用失败', error, 'API');
logger.fatal('应用崩溃', { crashReason: 'memory_overflow' }, 'System');

// 性能日志
performanceLogger.pageLoad('home', 1500);
performanceLogger.apiCall('getUserInfo', 800, true);
performanceLogger.userAction('button_click', { buttonId: 'login_btn' });

// 业务日志
businessLogger.login({ _id: 'user123', isNewUser: false });
businessLogger.publish({ _id: 'content456', type: 'article' });
businessLogger.search('关键词', 10);
businessLogger.payment(99.99, 'vip_membership');
```

### 日志配置
```javascript
import { logger, LOG_LEVELS } from '../utils/logger';

// 设置日志级别
logger.setLevel(LOG_LEVELS.DEBUG); // 开发环境
logger.setLevel(LOG_LEVELS.INFO);  // 生产环境

// 设置日志配置
logger.setConfig({
  level: LOG_LEVELS.INFO,
  enableConsole: true,
  enableStorage: true,
  enableReport: true,
  maxStorageSize: 1000,
  reportInterval: 5000,
  reportBatchSize: 50
});

// 获取本地日志
const localLogs = logger.getLocalLogs();
console.log('本地日志数量:', localLogs.length);

// 清空本地日志
logger.clearLocalLogs();

// 强制上报日志
logger.flush();
```

## 缓存管理使用

### 基础缓存操作
```javascript
import cacheManager, { cacheStrategies } from '../utils/cache';

// 内存缓存
cacheManager.memory.set('user_info', userData, 300000); // 5分钟
const userData = cacheManager.memory.get('user_info');
cacheManager.memory.delete('user_info');
cacheManager.memory.clear();

// 存储缓存
cacheManager.storage.set('app_config', configData, 1800000); // 30分钟
const configData = cacheManager.storage.get('app_config');
cacheManager.storage.delete('app_config');
cacheManager.storage.clear();

// 智能缓存（推荐）
cacheManager.smart.set('api_data', apiData, 60000); // 1分钟
const apiData = cacheManager.smart.get('api_data');
cacheManager.smart.delete('api_data');
cacheManager.smart.clear();
```

### 使用预定义缓存策略
```javascript
import cacheManager, { cacheStrategies } from '../utils/cache';

// API数据缓存（短期）
cacheManager.smart.set('home_cards', cardsData, cacheStrategies.apiData.memory);

// 用户数据缓存（中期）
cacheManager.smart.set('user_profile', profileData, cacheStrategies.userData.memory);

// 配置数据缓存（长期）
cacheManager.smart.set('app_settings', settingsData, cacheStrategies.configData.memory);
```

### 缓存装饰器使用
```javascript
import { cacheDecorator } from '../utils/cache';

class UserService {
  // 使用智能缓存，默认TTL
  @cacheDecorator('smart')
  async getUserInfo(userId) {
    // 方法实现
    return await api.getUserInfo(userId);
  }

  // 使用内存缓存，自定义TTL
  @cacheDecorator('memory', 300000)
  async getUserProfile(userId) {
    // 方法实现
    return await api.getUserProfile(userId);
  }
}
```

### 缓存统计和管理
```javascript
// 获取缓存统计
const stats = cacheManager.getStats();
console.log('内存缓存:', stats.memory);
console.log('存储缓存:', stats.storage);

// 设置缓存配置
cacheManager.setConfig({
  memory: {
    maxSize: 200,
    defaultTTL: 600000,
    cleanupInterval: 120000
  },
  storage: {
    prefix: 'myapp_cache_',
    maxSize: 100,
    defaultTTL: 3600000,
    cleanupInterval: 600000
  }
});
```

## 网络监控使用

### 基础网络状态检查
```javascript
import networkUtils, { NETWORK_STATUS, NETWORK_QUALITY } from '../utils/network';

// 获取当前网络状态
const status = networkUtils.getStatus();
console.log('网络状态:', status.isOnline);
console.log('网络类型:', status.status);
console.log('网络质量:', status.quality);

// 检查网络类型
if (networkUtils.isWifi()) {
  console.log('当前使用WiFi网络');
}

// 检查网络质量
if (networkUtils.isGoodQuality()) {
  console.log('网络质量良好');
}

// 测试网络连接
const testResult = await networkUtils.testConnection('https://www.baidu.com');
console.log('连接测试结果:', testResult);
```

### 网络状态监听
```javascript
import networkUtils from '../utils/network';

// 添加网络状态监听器
const removeListener = networkUtils.addListener((event) => {
  switch (event.type) {
    case 'statusChange':
      console.log('网络状态变化:', event.oldStatus, '->', event.newStatus);
      break;
    case 'offline':
      console.log('网络连接断开');
      // 显示离线提示
      wx.showToast({
        title: '网络连接断开',
        icon: 'none',
        duration: 2000
      });
      break;
    case 'online':
      console.log('网络连接恢复');
      // 清除离线提示，恢复数据同步
      this.syncData();
      break;
  }
});

// 移除监听器
removeListener();
```

### 离线任务管理
```javascript
import { offlineManager } from '../utils/network';

// 添加离线任务
offlineManager.addTask({
  id: 'update_profile_001',
  apiName: 'user.updateProfile',
  execute: async () => {
    return await userAPI.updateProfile(profileData);
  }
});

// 获取离线队列状态
const queueStatus = offlineManager.getQueueStatus();
console.log('离线任务数量:', queueStatus.length);

// 手动执行离线任务
await offlineManager.executeTasks();

// 清空离线队列
offlineManager.clearQueue();
```

### 网络统计信息
```javascript
import networkUtils from '../utils/network';

// 获取网络统计
const stats = networkUtils.getStats();
console.log('网络统计:', {
  总连接次数: stats.total,
  在线次数: stats.online,
  离线次数: stats.offline,
  在线率: stats.onlineRate,
  质量统计: stats.qualityStats
});

// 获取连接历史
const history = networkUtils.getHistory();
console.log('连接历史:', history);
```

## API服务使用

### 基础API调用
```javascript
import { homeAPI, userAPI, contentAPI } from '../api/services';

// 首页数据
const homeData = await homeAPI.getCards({ page: 1, pageSize: 10 });
const swipers = await homeAPI.getSwipers();

// 用户数据
const userInfo = await userAPI.getUserInfo();
const loginResult = await userAPI.wxLogin(userInfo);

// 内容数据
const contentDetail = await contentAPI.getDetail('content_id');
const publishResult = await contentAPI.publish(contentData);
```

### 批量API调用
```javascript
import { batchAPI } from '../api/services';

// 批量获取首页数据
const homeData = await batchAPI.getHomeData();
console.log('首页数据:', {
  卡片: homeData.cards,
  轮播图: homeData.swipers,
  标签: homeData.tags
});

// 批量获取用户数据
const userData = await batchAPI.getUserData();
console.log('用户数据:', {
  用户信息: userData.userInfo,
  未读消息: userData.unreadCount
});
```

### 缓存管理API
```javascript
import { cacheAPI } from '../api/services';

// 清除所有缓存
cacheAPI.clearAll();

// 清除特定API缓存
cacheAPI.clearAPI('home');

// 获取缓存统计
const stats = cacheAPI.getStats();
console.log('缓存统计:', stats);
```

### 网络管理API
```javascript
import { networkAPI } from '../api/services';

// 获取网络状态
const status = networkAPI.getStatus();

// 测试网络连接
const testResult = await networkAPI.testConnection();

// 获取网络统计
const stats = networkAPI.getStats();

// 添加网络监听器
const removeListener = networkAPI.addListener((event) => {
  console.log('网络事件:', event);
});
```

## 性能监控使用

### 在页面中使用性能监控组件
```xml
<!-- pages/home/index.wxml -->
<view class="container">
  <!-- 性能监控组件（无UI） -->
  <performance-monitor 
    id="performance-monitor"
    page-name="home" 
    enabled="{{true}}"
    config="{{{
      monitorPageLoad: true,
      monitorUserInteraction: true,
      monitorApiCall: true,
      thresholds: {
        pageLoad: 3000,
        interaction: 500,
        apiCall: 2000
      }
    }}}"
  />
  
  <!-- 页面内容 -->
  <view class="content">
    <!-- 其他组件 -->
  </view>
</view>
```

```javascript
// pages/home/index.js
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 获取性能监控组件实例
    this.performanceMonitor = this.selectComponent('#performance-monitor');
  },

  onShow() {
    // 记录页面显示
    this.performanceMonitor.recordEvent('page_show');
  },

  onReady() {
    // 记录页面加载完成
    this.performanceMonitor.recordPageLoadComplete();
  },

  // 用户交互事件
  onButtonTap(e) {
    const startTime = Date.now();
    
    // 执行操作
    this.handleButtonTap(e);
    
    // 记录交互性能
    const responseTime = Date.now() - startTime;
    this.performanceMonitor.recordInteraction('button_tap', e.target.dataset, responseTime);
  },

  // API调用事件
  async loadData() {
    const startTime = Date.now();
    
    try {
      const data = await homeAPI.getCards();
      const duration = Date.now() - startTime;
      
      // 记录API调用性能
      this.performanceMonitor.recordApiCall('home.getCards', duration, true);
      
      this.setData({ cards: data });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录失败的API调用
      this.performanceMonitor.recordApiCall('home.getCards', duration, false, error.message);
    }
  },

  // 获取性能统计
  getPerformanceStats() {
    const stats = this.performanceMonitor.getPerformanceStats();
    console.log('页面性能统计:', stats);
    return stats;
  }
});
```

### 在组件中使用性能监控
```javascript
// components/custom-component/index.js
Component({
  properties: {
    // 组件属性
  },

  data: {
    // 组件数据
  },

  methods: {
    // 记录组件事件
    recordComponentEvent(eventType, data = {}) {
      // 获取页面性能监控组件
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const performanceMonitor = currentPage.selectComponent('#performance-monitor');
      
      if (performanceMonitor) {
        performanceMonitor.recordEvent(`component_${eventType}`, {
          componentName: 'custom-component',
          ...data
        });
      }
    },

    // 组件交互
    onComponentTap() {
      this.recordComponentEvent('tap', { target: 'button' });
      // 组件逻辑
    }
  }
});
```

## 页面集成示例

### 完整的页面示例
```xml
<!-- pages/home/index.wxml -->
<view class="container">
  <!-- 性能监控组件 -->
  <performance-monitor 
    id="performance-monitor"
    page-name="home" 
    enabled="{{true}}"
    config="{{performanceConfig}}"
  />
  
  <!-- 页面内容 -->
  <view class="header">
    <text class="title">首页</text>
  </view>
  
  <view class="content">
    <view class="cards">
      <block wx:for="{{cards}}" wx:key="id">
        <view class="card" bindtap="onCardTap" data-card="{{item}}">
          <image src="{{item.image}}" mode="aspectFill" />
          <text class="title">{{item.title}}</text>
        </view>
      </block>
    </view>
  </view>
  
  <!-- 加载状态 -->
  <view class="loading" wx:if="{{loading}}">
    <text>加载中...</text>
  </view>
</view>
```

```javascript
// pages/home/index.js
import { homeAPI, batchAPI } from '../../api/services';
import { logger, performanceLogger } from '../../utils/logger';
import { cacheManager } from '../../utils/cache';
import { networkUtils } from '../../utils/network';

Page({
  data: {
    cards: [],
    swipers: [],
    loading: true,
    performanceConfig: {
      monitorPageLoad: true,
      monitorUserInteraction: true,
      monitorApiCall: true,
      thresholds: {
        pageLoad: 3000,
        interaction: 500,
        apiCall: 2000
      }
    }
  },

  onLoad() {
    this.performanceMonitor = this.selectComponent('#performance-monitor');
    this.loadPageData();
  },

  onShow() {
    this.performanceMonitor.recordEvent('page_show');
    
    // 检查网络状态
    if (!networkUtils.isOnline()) {
      wx.showToast({
        title: '网络连接不可用',
        icon: 'none',
        duration: 2000
      });
    }
  },

  onReady() {
    this.performanceMonitor.recordPageLoadComplete();
  },

  // 加载页面数据
  async loadPageData() {
    try {
      logger.info('开始加载首页数据', {}, 'Home');
      
      // 尝试从缓存获取
      const cachedData = cacheManager.smart.get('home_page_data');
      if (cachedData) {
        this.setData({
          cards: cachedData.cards,
          swipers: cachedData.swipers,
          loading: false
        });
        logger.info('从缓存加载首页数据', {}, 'Home');
        return;
      }

      // 批量获取数据
      const homeData = await batchAPI.getHomeData();
      
      this.setData({
        cards: homeData.cards,
        swipers: homeData.swipers,
        loading: false
      });

      // 缓存数据
      cacheManager.smart.set('home_page_data', homeData, 300000); // 5分钟
      
      logger.info('首页数据加载完成', { 
        cardsCount: homeData.cards.length,
        swipersCount: homeData.swipers.length 
      }, 'Home');
      
    } catch (error) {
      logger.error('首页数据加载失败', error, 'Home');
      
      this.setData({ loading: false });
      
      wx.showToast({
        title: '数据加载失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 卡片点击事件
  onCardTap(e) {
    const startTime = Date.now();
    const card = e.currentTarget.dataset.card;
    
    // 记录用户行为
    performanceLogger.userAction('card_click', {
      cardId: card.id,
      cardType: card.type
    });
    
    // 页面跳转
    wx.navigateTo({
      url: `/pages/detail/index?id=${card.id}`,
      success: () => {
        const responseTime = Date.now() - startTime;
        this.performanceMonitor.recordInteraction('card_tap', { cardId: card.id }, responseTime);
      }
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 清除缓存
      cacheManager.smart.delete('home_page_data');
      
      // 重新加载数据
      await this.loadPageData();
      
      wx.stopPullDownRefresh();
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      logger.error('下拉刷新失败', error, 'Home');
      
      wx.stopPullDownRefresh();
      
      wx.showToast({
        title: '刷新失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 获取页面统计
  getPageStats() {
    const performanceStats = this.performanceMonitor.getPerformanceStats();
    const networkStats = networkUtils.getStats();
    const cacheStats = cacheManager.getStats();
    
    return {
      performance: performanceStats,
      network: networkStats,
      cache: cacheStats
    };
  }
});
```

```css
/* pages/home/index.wxss */
.container {
  padding: 20rpx;
}

.header {
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.card image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.card .title {
  font-size: 28rpx;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
```

## 最佳实践

### 1. 日志记录最佳实践
```javascript
// ✅ 好的做法
logger.info('用户登录成功', { 
  userId: '123', 
  loginTime: Date.now(),
  loginMethod: 'wechat' 
}, 'Auth');

// ❌ 不好的做法
console.log('用户登录成功'); // 没有结构化信息
```

### 2. 缓存使用最佳实践
```javascript
// ✅ 好的做法 - 使用合适的缓存策略
cacheManager.smart.set('user_profile', userData, cacheStrategies.userData.memory);

// ❌ 不好的做法 - 缓存敏感数据
cacheManager.smart.set('user_password', password, 3600000);
```

### 3. 网络处理最佳实践
```javascript
// ✅ 好的做法 - 检查网络状态
if (!networkUtils.isOnline()) {
  wx.showToast({ title: '网络连接不可用', icon: 'none' });
  return;
}

// ❌ 不好的做法 - 直接调用API
await api.getData(); // 可能失败
```

### 4. 性能监控最佳实践
```javascript
// ✅ 好的做法 - 记录关键性能指标
this.performanceMonitor.recordPageLoadComplete();
this.performanceMonitor.recordInteraction('button_click', {}, responseTime);

// ❌ 不好的做法 - 过度监控
// 不要记录每个小事件，只记录关键性能指标
```

### 5. 错误处理最佳实践
```javascript
// ✅ 好的做法 - 统一错误处理
try {
  const result = await api.getData();
  return result;
} catch (error) {
  logger.error('获取数据失败', error, 'API');
  
  // 用户友好的错误提示
  wx.showToast({
    title: '数据加载失败，请重试',
    icon: 'none',
    duration: 2000
  });
  
  throw error;
}
```

### 6. 配置管理最佳实践
```javascript
// ✅ 好的做法 - 环境相关配置
const config = {
  dev: {
    logLevel: 'debug',
    enableMock: true
  },
  prod: {
    logLevel: 'info',
    enableMock: false
  }
};

// ❌ 不好的做法 - 硬编码配置
const logLevel = 'debug'; // 生产环境也会是debug
```

这些示例展示了如何在实际项目中使用所有优化功能，帮助开发者快速上手并遵循最佳实践。 