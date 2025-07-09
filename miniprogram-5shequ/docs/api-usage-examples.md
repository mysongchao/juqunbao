# API 使用示例文档

## 概述

本文档提供了优化后的API使用示例，包括前端调用方式和错误处理。

## 1. 基础配置

### 环境配置
```javascript
// config.js 已优化，支持环境自动切换
import config from '../config';

console.log(config.isMock); // 开发环境: true, 生产环境: false
console.log(config.baseUrl); // 开发环境: '', 生产环境: 'https://your-api.com'
```

### 初始化错误处理
```javascript
// app.js
import { setupGlobalErrorHandler } from './utils/errorHandler';

App({
  onLaunch() {
    // 设置全局错误处理
    setupGlobalErrorHandler();
  }
});
```

## 2. API 服务层使用

### 导入API服务
```javascript
import api from '../api/services';
// 或者按需导入
import { homeAPI, userAPI, contentAPI } from '../api/services';
```

### 首页数据获取
```javascript
// 方式1: 使用批量API
const getHomeData = async () => {
  try {
    const data = await api.batch.getHomeData();
    console.log('首页数据:', data);
    // data: { cards: [], swipers: [], tags: [] }
  } catch (error) {
    console.error('获取首页数据失败:', error);
  }
};

// 方式2: 单独调用
const getCards = async () => {
  try {
    const cards = await api.home.getCards({
      flowType: 'recommend',
      page: 1,
      pageSize: 20
    });
    console.log('内容卡片:', cards);
  } catch (error) {
    console.error('获取内容卡片失败:', error);
  }
};
```

### 用户相关操作
```javascript
// 微信登录
const login = async () => {
  try {
    const userInfo = await wx.getUserProfile({
      desc: '用于完善用户资料'
    });
    
    const result = await api.user.wxLogin(userInfo.userInfo);
    console.log('登录成功:', result);
    
    // 保存用户信息
    wx.setStorageSync('userInfo', result.userInfo);
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    const userInfo = await api.user.getUserInfo();
    console.log('用户信息:', userInfo);
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
```

### 内容发布
```javascript
// 发布内容
const publishContent = async (content) => {
  try {
    const result = await api.content.publish({
      images: ['cloud://xxx/image1.jpg'],
      title: '我的作品',
      desc: '这是一段描述',
      tags: ['AI绘画', '原创']
    });
    console.log('发布成功:', result);
  } catch (error) {
    console.error('发布失败:', error);
  }
};

// 保存草稿
const saveDraft = async (content, draftId = null) => {
  try {
    const result = await api.content.draft({
      draftId,
      ...content
    });
    console.log('草稿保存成功:', result);
  } catch (error) {
    console.error('草稿保存失败:', error);
  }
};
```

### 搜索功能
```javascript
// 搜索内容
const searchContent = async (keyword) => {
  try {
    // 添加搜索历史
    await api.search.addHistory(keyword);
    
    // 搜索内容
    const result = await api.search.searchContent(keyword, 1, 20);
    console.log('搜索结果:', result);
  } catch (error) {
    console.error('搜索失败:', error);
  }
};

// 获取搜索历史
const getSearchHistory = async () => {
  try {
    const history = await api.search.getHistory();
    console.log('搜索历史:', history);
  } catch (error) {
    console.error('获取搜索历史失败:', error);
  }
};
```

### 文件上传
```javascript
// 上传图片
const uploadImage = async (tempFilePath) => {
  try {
    // 先上传到微信临时文件
    const uploadRes = await wx.uploadFile({
      url: 'https://api.weixin.qq.com/cgi-bin/media/upload',
      filePath: tempFilePath,
      name: 'media'
    });
    
    // 再上传到云存储
    const result = await api.upload.uploadImage(
      uploadRes.fileID,
      'image.jpg'
    );
    console.log('图片上传成功:', result);
    return result.fileID;
  } catch (error) {
    console.error('图片上传失败:', error);
  }
};
```

## 3. 错误处理

### 使用错误处理工具
```javascript
import { showError, handleError, createError } from '../utils/errorHandler';

// 显示错误提示
const handleApiError = (error) => {
  const appError = handleError(error, 'API调用');
  showError(appError);
};

// 自定义错误
const customError = createError(4001, '数据不存在');
showError(customError, { showCancel: true });
```

### 页面错误处理
```javascript
// 使用页面错误处理装饰器
import { pageErrorHandler } from '../utils/errorHandler';

const pageConfig = pageErrorHandler({
  data: {
    // 页面数据
  },
  onLoad(options) {
    // 页面加载逻辑
  },
  onShow() {
    // 页面显示逻辑
  }
});

Page(pageConfig);
```

### 异步函数错误处理
```javascript
import { asyncErrorHandler } from '../utils/errorHandler';

const safeApiCall = asyncErrorHandler(async (params) => {
  const result = await api.home.getCards(params);
  return result;
});

// 使用
try {
  const result = await safeApiCall({ flowType: 'recommend' });
  console.log('调用成功:', result);
} catch (error) {
  console.error('调用失败:', error);
}
```

## 4. 高级功能

### 批量请求
```javascript
import { batchRequest } from '../api/request';

const batchCall = async () => {
  const requests = [
    api.home.getCards({ flowType: 'recommend' }),
    api.home.getSwipers(),
    api.user.getUserInfo()
  ];
  
  const results = await batchRequest(requests);
  console.log('批量请求结果:', results);
};
```

### 请求队列
```javascript
import { queueRequest } from '../api/request';

const queuedCall = async () => {
  const result = await queueRequest(async () => {
    return await api.content.publish(contentData);
  });
  console.log('队列请求结果:', result);
};
```

### 重试机制
```javascript
// 请求封装已内置重试机制，自动处理网络错误
const retryCall = async () => {
  try {
    const result = await api.home.getCards();
    console.log('请求成功:', result);
  } catch (error) {
    // 如果重试后仍然失败，会抛出错误
    console.error('请求失败:', error);
  }
};
```

## 5. 最佳实践

### 1. 统一错误处理
```javascript
// 在页面中统一处理API错误
Page({
  async callApi() {
    try {
      const result = await api.home.getCards();
      this.setData({ cards: result.list });
    } catch (error) {
      showError(error);
    }
  }
});
```

### 2. 加载状态管理
```javascript
Page({
  data: {
    loading: false,
    cards: []
  },
  
  async loadData() {
    this.setData({ loading: true });
    try {
      const result = await api.home.getCards();
      this.setData({ 
        cards: result.list,
        loading: false 
      });
    } catch (error) {
      this.setData({ loading: false });
      showError(error);
    }
  }
});
```

### 3. 数据缓存
```javascript
const cacheKey = 'home_cards';
const cacheExpire = 5 * 60 * 1000; // 5分钟

const getCachedCards = async () => {
  const cached = wx.getStorageSync(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheExpire) {
    return cached.data;
  }
  
  const result = await api.home.getCards();
  wx.setStorageSync(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
};
```

### 4. 防抖处理
```javascript
let searchTimer = null;

const debouncedSearch = (keyword) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    try {
      const result = await api.search.searchContent(keyword);
      this.setData({ searchResults: result.list });
    } catch (error) {
      showError(error);
    }
  }, 300);
};
```

## 6. 调试技巧

### 开启详细日志
```javascript
// 在开发环境中开启详细日志
if (config.isMock) {
  console.log('当前使用Mock数据');
}

// 查看请求详情
const response = await api.home.getCards();
console.log('完整响应:', response);
```

### 错误调试
```javascript
// 查看错误详情
try {
  await api.home.getCards();
} catch (error) {
  console.error('错误类型:', error.constructor.name);
  console.error('错误信息:', error.message);
  console.error('错误堆栈:', error.stack);
  console.error('错误详情:', error.toJSON?.());
}
```

## 总结

通过以上优化，我们实现了：

1. ✅ 统一的环境配置管理
2. ✅ 完善的错误处理机制
3. ✅ 统一的API服务层
4. ✅ 自动重试和请求队列
5. ✅ 详细的日志记录
6. ✅ 类型安全的响应格式

这些优化大大提升了代码的可维护性和用户体验。 