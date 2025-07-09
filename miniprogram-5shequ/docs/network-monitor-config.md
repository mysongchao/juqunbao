# 网络监控配置指南

## 概述

网络监控系统已经集成到您的微信小程序中，用于实时监控网络状态、质量评估和离线处理。本文档介绍如何配置和优化网络监控功能。

## 当前配置

### 基础配置
```javascript
const NETWORK_CONFIG = {
  // 检测间隔（毫秒）
  checkInterval: 10000, // 10秒检测一次
  
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
    enableStatusChangeLog: true,    // 状态变化日志
    enableQualityLog: false,        // 质量检测日志
    enableConnectionTestLog: false  // 连接测试日志
  }
};
```

## 配置选项说明

### 1. 检测间隔 (checkInterval)
- **默认值**: 10000ms (10秒)
- **说明**: 网络状态检测的时间间隔
- **建议**: 
  - 开发环境: 5000ms (5秒)
  - 生产环境: 10000ms (10秒)
  - 低电量模式: 30000ms (30秒)

### 2. 连接超时 (timeout)
- **默认值**: 10000ms (10秒)
- **说明**: 网络连接测试的超时时间
- **建议**: 根据网络环境调整，WiFi环境可以设置更短

### 3. 重试次数 (retryTimes)
- **默认值**: 3次
- **说明**: 网络请求失败时的重试次数
- **建议**: 根据业务需求调整，建议2-5次

### 4. 质量阈值 (qualityThresholds)
- **excellent**: 100ms - 优秀网络质量
- **good**: 300ms - 良好网络质量
- **poor**: 1000ms - 较差网络质量
- **bad**: 1000ms+ - 差网络质量

### 5. 日志配置 (logging)
- **enableStatusChangeLog**: 是否记录网络状态变化
- **enableQualityLog**: 是否记录网络质量检测
- **enableConnectionTestLog**: 是否记录连接测试

## 环境配置建议

### 开发环境
```javascript
const devConfig = {
  checkInterval: 5000,
  timeout: 5000,
  retryTimes: 2,
  logging: {
    enableStatusChangeLog: true,
    enableQualityLog: true,
    enableConnectionTestLog: true
  }
};
```

### 生产环境
```javascript
const prodConfig = {
  checkInterval: 10000,
  timeout: 10000,
  retryTimes: 3,
  logging: {
    enableStatusChangeLog: true,
    enableQualityLog: false,
    enableConnectionTestLog: false
  }
};
```

### 低电量模式
```javascript
const lowPowerConfig = {
  checkInterval: 30000,
  timeout: 15000,
  retryTimes: 2,
  logging: {
    enableStatusChangeLog: false,
    enableQualityLog: false,
    enableConnectionTestLog: false
  }
};
```

## 使用方法

### 1. 基础使用
```javascript
import { networkUtils } from '../utils/network';

// 获取网络状态
const status = networkUtils.getStatus();
console.log('网络状态:', status.isOnline, status.status, status.quality);

// 检查网络类型
if (networkUtils.isWifi()) {
  console.log('当前使用WiFi网络');
}

// 检查网络质量
if (networkUtils.isGoodQuality()) {
  console.log('网络质量良好');
}
```

### 2. 网络状态监听
```javascript
import { networkUtils } from '../utils/network';

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

### 3. 离线任务管理
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
```

### 4. 网络测试
```javascript
import { networkUtils } from '../utils/network';

// 测试网络连接
const testResult = await networkUtils.testConnection('https://www.baidu.com');
console.log('连接测试结果:', testResult);

// 获取网络统计
const stats = networkUtils.getStats();
console.log('网络统计:', stats);
```

## 性能优化建议

### 1. 减少检测频率
- 在稳定的网络环境下，可以增加检测间隔
- 在移动网络环境下，保持适中的检测频率

### 2. 优化日志输出
- 生产环境关闭不必要的日志
- 只在状态真正变化时记录日志
- 使用不同的日志级别

### 3. 智能重试策略
- 根据网络质量调整重试次数
- 实现指数退避重试
- 区分不同类型的网络错误

### 4. 缓存优化
- 在网络良好时预加载数据
- 在网络较差时使用缓存数据
- 实现智能缓存策略

## 故障排除

### 1. 频繁的网络状态变化
**问题**: 网络状态频繁变化，产生大量日志
**解决方案**: 
- 增加检测间隔
- 添加状态变化防抖
- 关闭不必要的日志

### 2. 网络检测不准确
**问题**: 网络状态检测结果不准确
**解决方案**:
- 调整超时时间
- 使用多个测试地址
- 实现更复杂的检测逻辑

### 3. 离线任务执行失败
**问题**: 离线任务无法正常执行
**解决方案**:
- 检查任务格式是否正确
- 验证网络恢复状态
- 添加任务执行日志

### 4. 性能影响
**问题**: 网络监控影响应用性能
**解决方案**:
- 减少检测频率
- 优化检测逻辑
- 使用Web Worker进行检测

## 监控指标

### 1. 网络状态指标
- 在线率: 网络连接时间占总时间的比例
- 状态变化频率: 网络状态变化的频率
- 连接质量分布: 不同质量等级的分布

### 2. 性能指标
- 检测响应时间: 网络检测的响应时间
- 任务执行成功率: 离线任务执行的成功率
- 缓存命中率: 网络缓存的使用效果

### 3. 用户体验指标
- 网络切换延迟: 网络状态切换的响应时间
- 离线功能可用性: 离线功能的可用程度
- 错误提示准确性: 网络错误提示的准确性

## 最佳实践

### 1. 配置管理
- 根据环境动态调整配置
- 提供用户可配置的选项
- 实现配置的热更新

### 2. 错误处理
- 优雅处理网络错误
- 提供用户友好的错误提示
- 实现自动恢复机制

### 3. 用户体验
- 在网络切换时提供平滑过渡
- 在离线时保持基本功能可用
- 提供网络状态的可视化指示

### 4. 性能优化
- 避免频繁的网络检测
- 优化网络请求的时机
- 实现智能的缓存策略

## 总结

网络监控系统为您的微信小程序提供了强大的网络状态管理能力。通过合理的配置和优化，可以显著提升应用的稳定性和用户体验。建议根据实际使用情况调整配置参数，并定期监控相关指标以持续优化。 