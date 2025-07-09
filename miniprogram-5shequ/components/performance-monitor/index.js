/**
 * 页面性能监控组件
 * 监控页面加载时间、用户交互响应时间等性能指标
 */

import { performanceLogger } from '../../utils/logger';

Component({
  properties: {
    // 页面名称
    pageName: {
      type: String,
      value: ''
    },
    
    // 是否启用监控
    enabled: {
      type: Boolean,
      value: true
    },
    
    // 监控配置
    config: {
      type: Object,
      value: {
        // 是否监控页面加载
        monitorPageLoad: true,
        // 是否监控用户交互
        monitorUserInteraction: true,
        // 是否监控API调用
        monitorApiCall: true,
        // 性能阈值（毫秒）
        thresholds: {
          pageLoad: 3000,      // 页面加载超过3秒警告
          interaction: 500,    // 交互响应超过500ms警告
          apiCall: 2000        // API调用超过2秒警告
        }
      }
    }
  },

  data: {
    pageLoadStartTime: 0,
    pageLoadEndTime: 0,
    interactionStartTime: 0,
    isMonitoring: false
  },

  lifetimes: {
    attached() {
      if (this.properties.enabled) {
        this.startMonitoring();
      }
    },

    detached() {
      this.stopMonitoring();
    }
  },

  methods: {
    // 开始监控
    startMonitoring() {
      if (this.data.isMonitoring) return;
      
      this.setData({ isMonitoring: true });
      
      // 记录页面加载开始时间
      if (this.properties.config.monitorPageLoad) {
        this.data.pageLoadStartTime = Date.now();
      }
      
      // 监听页面显示
      this.bindPageShow();
      
      // 监听用户交互
      if (this.properties.config.monitorUserInteraction) {
        this.bindUserInteraction();
      }
      
      // 监听API调用
      if (this.properties.config.monitorApiCall) {
        this.bindApiCall();
      }
      
      performanceLogger.info(`开始监控页面: ${this.properties.pageName}`, {
        config: this.properties.config
      }, 'Performance');
    },

    // 停止监控
    stopMonitoring() {
      if (!this.data.isMonitoring) return;
      
      this.setData({ isMonitoring: false });
      
      // 记录页面加载结束时间
      if (this.properties.config.monitorPageLoad && this.data.pageLoadStartTime > 0) {
        this.data.pageLoadEndTime = Date.now();
        const loadTime = this.data.pageLoadEndTime - this.data.pageLoadStartTime;
        
        performanceLogger.pageLoad(this.properties.pageName, loadTime);
        
        // 检查是否超过阈值
        if (loadTime > this.properties.config.thresholds.pageLoad) {
          performanceLogger.warn(`页面加载时间过长: ${this.properties.pageName}`, {
            loadTime,
            threshold: this.properties.config.thresholds.pageLoad
          }, 'Performance');
        }
      }
      
      performanceLogger.info(`停止监控页面: ${this.properties.pageName}`, {
        loadTime: this.data.pageLoadEndTime - this.data.pageLoadStartTime
      }, 'Performance');
    },

    // 绑定页面显示事件
    bindPageShow() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (currentPage && currentPage.onShow) {
        const originalOnShow = currentPage.onShow;
        currentPage.onShow = function() {
          // 记录页面显示时间
          performanceLogger.userAction('pageShow', {
            pageName: this.properties.pageName,
            timestamp: Date.now()
          });
          
          // 调用原始方法
          if (originalOnShow) {
            originalOnShow.call(this);
          }
        }.bind(this);
      }
    },

    // 绑定用户交互事件
    bindUserInteraction() {
      // 监听点击事件
      this.bindEvent('tap');
      
      // 监听长按事件
      this.bindEvent('longpress');
      
      // 监听滑动事件
      this.bindEvent('swipe');
      
      // 监听输入事件
      this.bindEvent('input');
      
      // 监听滚动事件
      this.bindEvent('scroll');
    },

    // 绑定事件监听
    bindEvent(eventType) {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      if (currentPage) {
        // 为页面添加事件监听
        currentPage[`on${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`] = function(e) {
          const startTime = Date.now();
          
          // 记录交互开始
          performanceLogger.userAction(`interaction_${eventType}_start`, {
            pageName: this.properties.pageName,
            eventType,
            target: e.target?.dataset || {},
            timestamp: startTime
          });
          
          // 使用setTimeout来监控响应时间
          setTimeout(() => {
            const responseTime = Date.now() - startTime;
            
            performanceLogger.userAction(`interaction_${eventType}_end`, {
              pageName: this.properties.pageName,
              eventType,
              responseTime,
              timestamp: Date.now()
            });
            
            // 检查是否超过阈值
            if (responseTime > this.properties.config.thresholds.interaction) {
              performanceLogger.warn(`用户交互响应时间过长: ${eventType}`, {
                responseTime,
                threshold: this.properties.config.thresholds.interaction,
                pageName: this.properties.pageName
              }, 'Performance');
            }
          }, 0);
        }.bind(this);
      }
    },

    // 绑定API调用监控
    bindApiCall() {
      // 重写wx.cloud.callFunction来监控云函数调用
      const originalCallFunction = wx.cloud.callFunction;
      wx.cloud.callFunction = function(options) {
        const startTime = Date.now();
        const apiName = options.name;
        
        performanceLogger.userAction('api_call_start', {
          apiName,
          pageName: this.properties.pageName,
          timestamp: startTime
        });
        
        return originalCallFunction.call(this, options).then(result => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          performanceLogger.userAction('api_call_end', {
            apiName,
            pageName: this.properties.pageName,
            duration,
            success: true,
            timestamp: endTime
          });
          
          // 检查是否超过阈值
          if (duration > this.properties.config.thresholds.apiCall) {
            performanceLogger.warn(`API调用时间过长: ${apiName}`, {
              duration,
              threshold: this.properties.config.thresholds.apiCall,
              pageName: this.properties.pageName
            }, 'Performance');
          }
          
          return result;
        }).catch(error => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          performanceLogger.userAction('api_call_end', {
            apiName,
            pageName: this.properties.pageName,
            duration,
            success: false,
            error: error.message,
            timestamp: endTime
          });
          
          throw error;
        });
      }.bind(this);
    },

    // 手动记录性能事件
    recordEvent(eventType, data = {}) {
      if (!this.data.isMonitoring) return;
      
      performanceLogger.userAction(eventType, {
        pageName: this.properties.pageName,
        ...data,
        timestamp: Date.now()
      });
    },

    // 记录页面加载完成
    recordPageLoadComplete() {
      if (this.data.pageLoadStartTime > 0) {
        this.data.pageLoadEndTime = Date.now();
        const loadTime = this.data.pageLoadEndTime - this.data.pageLoadStartTime;
        
        performanceLogger.pageLoad(this.properties.pageName, loadTime);
        
        // 检查是否超过阈值
        if (loadTime > this.properties.config.thresholds.pageLoad) {
          performanceLogger.warn(`页面加载时间过长: ${this.properties.pageName}`, {
            loadTime,
            threshold: this.properties.config.thresholds.pageLoad
          }, 'Performance');
        }
      }
    },

    // 记录用户交互
    recordInteraction(eventType, target = {}, responseTime = 0) {
      if (!this.data.isMonitoring) return;
      
      performanceLogger.userAction('user_interaction', {
        pageName: this.properties.pageName,
        eventType,
        target,
        responseTime,
        timestamp: Date.now()
      });
      
      // 检查是否超过阈值
      if (responseTime > this.properties.config.thresholds.interaction) {
        performanceLogger.warn(`用户交互响应时间过长: ${eventType}`, {
          responseTime,
          threshold: this.properties.config.thresholds.interaction,
          pageName: this.properties.pageName
        }, 'Performance');
      }
    },

    // 记录API调用
    recordApiCall(apiName, duration, success = true, error = null) {
      if (!this.data.isMonitoring) return;
      
      performanceLogger.apiCall(apiName, duration, success);
      
      // 检查是否超过阈值
      if (duration > this.properties.config.thresholds.apiCall) {
        performanceLogger.warn(`API调用时间过长: ${apiName}`, {
          duration,
          threshold: this.properties.config.thresholds.apiCall,
          pageName: this.properties.pageName,
          error
        }, 'Performance');
      }
    },

    // 获取性能统计
    getPerformanceStats() {
      return {
        pageName: this.properties.pageName,
        isMonitoring: this.data.isMonitoring,
        pageLoadTime: this.data.pageLoadEndTime - this.data.pageLoadStartTime,
        config: this.properties.config
      };
    }
  }
}); 