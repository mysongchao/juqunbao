const express = require('express');
const cors = require('cors');

console.log('🚀 启动简化版测试服务器...');
console.log('📋 当前工作目录:', process.cwd());
console.log('📦 Node.js 版本:', process.version);
console.log('🌍 环境变量:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.env.PWD
});

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 配置 Express 中间件...');

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  console.log('🏥 健康检查请求');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '简化版服务器运行正常'
  });
});

// 根路径
app.get('/', (req, res) => {
  console.log('🏠 根路径请求');
  res.status(200).json({ 
    status: 'OK', 
    message: '简化版微信小程序云函数API服务器',
    timestamp: new Date().toISOString() 
  });
});

// 腾讯云健康检查
app.get('/_/health', (req, res) => {
  console.log('🏥 腾讯云健康检查请求');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '腾讯云健康检查通过'
  });
});

// 测试API
app.get('/api/test', (req, res) => {
  console.log('🧪 测试API请求');
  res.json({
    success: true,
    message: '简化版API测试成功',
    timestamp: new Date().toISOString(),
    data: {
      test: 'Hello from simplified server!',
      environment: process.env.NODE_ENV || 'development'
    }
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
  console.log(`✅ 简化版服务器启动成功！`);
  console.log(`🌐 监听地址: 0.0.0.0:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🏠 根路径: http://localhost:${PORT}/`);
  console.log(`🧪 测试API: http://localhost:${PORT}/api/test`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
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