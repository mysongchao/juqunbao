const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const net = require('net');

// 添加详细的启动日志
console.log('🚀 开始启动微信小程序云函数API服务...');
console.log('📋 当前工作目录:', process.cwd());
console.log('📦 Node.js 版本:', process.version);
console.log('🌍 环境变量:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.env.PWD
});

// 导入云函数模块
console.log('📁 开始导入云函数模块...');
try {
  const homeModule = require('./cloudfunctions/home/index.js');
  console.log('✅ home 模块导入成功');
} catch (error) {
  console.error('❌ home 模块导入失败:', error.message);
}

try {
  const userModule = require('./cloudfunctions/user/index.js');
  console.log('✅ user 模块导入成功');
} catch (error) {
  console.error('❌ user 模块导入失败:', error.message);
}

try {
  const contentModule = require('./cloudfunctions/content/index.js');
  console.log('✅ content 模块导入成功');
} catch (error) {
  console.error('❌ content 模块导入失败:', error.message);
}

try {
  const searchModule = require('./cloudfunctions/search/index.js');
  console.log('✅ search 模块导入成功');
} catch (error) {
  console.error('❌ search 模块导入失败:', error.message);
}

try {
  const uploadModule = require('./cloudfunctions/upload/index.js');
  console.log('✅ upload 模块导入成功');
} catch (error) {
  console.error('❌ upload 模块导入失败:', error.message);
}

try {
  const messageModule = require('./cloudfunctions/message/index.js');
  console.log('✅ message 模块导入成功');
} catch (error) {
  console.error('❌ message 模块导入失败:', error.message);
}

try {
  const tagsModule = require('./cloudfunctions/tags/index.js');
  console.log('✅ tags 模块导入成功');
} catch (error) {
  console.error('❌ tags 模块导入失败:', error.message);
}

try {
  const contentActionsModule = require('./cloudfunctions/contentActions/index.js');
  console.log('✅ contentActions 模块导入成功');
} catch (error) {
  console.error('❌ contentActions 模块导入失败:', error.message);
}

try {
  const getContentDetailModule = require('./cloudfunctions/getContentDetail/index.js');
  console.log('✅ getContentDetail 模块导入成功');
} catch (error) {
  console.error('❌ getContentDetail 模块导入失败:', error.message);
}

const PORT = process.env.PORT || 3000;

function startServer() {
  const app = express();

  console.log('🔧 配置 Express 中间件...');

  // 中间件
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // 健康检查端点
  app.get('/health', (req, res) => {
    console.log('🏥 健康检查请求');
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // 腾讯云云托管健康检查端点
  app.get('/', (req, res) => {
    console.log('🏠 根路径请求');
    res.status(200).json({
      status: 'OK',
      message: 'WeChat Miniprogram Cloud Functions API',
      timestamp: new Date().toISOString()
    });
  });

  // 腾讯云云托管特定的健康检查路径
  app.get('/_/health', (req, res) => {
    console.log('🏥 腾讯云健康检查请求');
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

      console.log(`📞 API 请求: ${functionName}/${action}`, event);

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

      console.log(`✅ API 响应: ${functionName}/${action}`, result);
      res.json(result);
    } catch (error) {
      console.error('❌ API 错误:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 默认路由
  app.get('/api', (req, res) => {
    console.log('📋 API 信息请求');
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
    console.log('❌ 404 请求:', req.originalUrl);
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString()
    });
  });

  // 启动服务器
  console.log(`🚀 开始监听端口 ${PORT}...`);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 服务器启动成功！`);
    console.log(`🌐 监听地址: 0.0.0.0:${PORT}`);
    console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
    console.log(`📋 API 信息: http://localhost:${PORT}/api`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 可用函数: home, user, content, search, upload, message, tags, contentActions, getContentDetail`);
  });

  // 错误处理
  process.on('uncaughtException', (error) => {
    console.error('🚨 未捕获的异常:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 未处理的 Promise 拒绝:', reason);
    process.exit(1);
  });

  module.exports = app;
}

// 端口检测逻辑
const tester = net.createServer()
  .once('error', function (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用，请检查是否有其他进程占用该端口！`);
      process.exit(1);
    } else {
      console.error('❌ 端口检测出错:', err);
      process.exit(1);
    }
  })
  .once('listening', function () {
    console.log(`✅ 端口 ${PORT} 可用，准备启动服务...`);
    tester.close();
    startServer();
  })
  .listen(PORT, '0.0.0.0'); 