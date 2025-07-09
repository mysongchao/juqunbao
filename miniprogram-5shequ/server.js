const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// 导入云函数模块
const homeModule = require('./cloudfunctions/home/index.js');
const userModule = require('./cloudfunctions/user/index.js');
const contentModule = require('./cloudfunctions/content/index.js');
const searchModule = require('./cloudfunctions/search/index.js');
const uploadModule = require('./cloudfunctions/upload/index.js');
const messageModule = require('./cloudfunctions/message/index.js');
const tagsModule = require('./cloudfunctions/tags/index.js');
const contentActionsModule = require('./cloudfunctions/contentActions/index.js');
const getContentDetailModule = require('./cloudfunctions/getContentDetail/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 腾讯云云托管健康检查端点
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'WeChat Miniprogram Cloud Functions API',
    timestamp: new Date().toISOString() 
  });
});

// 腾讯云云托管特定的健康检查路径
app.get('/_/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 云函数路由处理
app.post('/api/:functionName/:action', async (req, res) => {
  try {
    const { functionName, action } = req.params;
    const event = req.body;
    const context = {
      OPENID: req.headers['x-openid'] || 'test-openid',
      ENV: process.env.NODE_ENV || 'development'
    };

    let result;
    
    // 根据函数名路由到对应的云函数
    switch (functionName) {
      case 'home':
        result = await homeModule.main({ ...event, type: action }, context);
        break;
      case 'user':
        result = await userModule.main({ ...event, type: action }, context);
        break;
      case 'content':
        result = await contentModule.main({ ...event, type: action }, context);
        break;
      case 'search':
        result = await searchModule.main({ ...event, type: action }, context);
        break;
      case 'upload':
        result = await uploadModule.main({ ...event, type: action }, context);
        break;
      case 'message':
        result = await messageModule.main({ ...event, type: action }, context);
        break;
      case 'tags':
        result = await tagsModule.main({ ...event, type: action }, context);
        break;
      case 'contentActions':
        result = await contentActionsModule.main({ ...event, type: action }, context);
        break;
      case 'getContentDetail':
        result = await getContentDetailModule.main({ ...event, type: action }, context);
        break;
      default:
        throw new Error(`Function ${functionName} not found`);
    }

    res.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 默认路由
app.get('/', (req, res) => {
  res.json({
    message: 'WeChat Miniprogram Cloud Functions API',
    version: '1.0.0',
    availableFunctions: [
      'home', 'user', 'content', 'search', 'upload', 
      'message', 'tags', 'contentActions', 'getContentDetail'
    ],
    usage: 'POST /api/{functionName}/{action} with JSON body'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 