# Git 仓库配置检查指南

## 当前状态
- **仓库地址**: git@github.com:mysongchao/juqunbao.git
- **仓库类型**: GitHub 私有仓库
- **访问方式**: SSH

## 腾讯云配置检查步骤

### 1. 检查云托管服务配置
1. 登录腾讯云控制台
2. 进入云托管服务
3. 找到你的服务 `juqunbao`
4. 检查"代码仓库"配置

### 2. 配置 GitHub 访问

#### 方法 A: 使用 Personal Access Token
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - ✅ repo (Full control of private repositories)
   - ✅ workflow (Update GitHub Action workflows)
4. 生成并复制 token

#### 方法 B: 使用 SSH 密钥
1. 生成 SSH 密钥：
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```
2. 添加公钥到 GitHub：
   - 复制 `~/.ssh/id_rsa.pub` 内容
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容

### 3. 腾讯云配置
在云托管服务配置中：

#### 如果使用 Token：
- **仓库地址**: https://github.com/mysongchao/juqunbao.git
- **用户名**: 你的 GitHub 用户名
- **密码**: Personal Access Token

#### 如果使用 SSH：
- **仓库地址**: git@github.com:mysongchao/juqunbao.git
- **SSH 私钥**: 复制 `~/.ssh/id_rsa` 内容

### 4. 测试连接
配置完成后，点击"测试连接"确保可以正常访问仓库。

## 故障排除

### 如果仍然无法访问：
1. **检查网络**: 确保腾讯云服务器可以访问 GitHub
2. **检查权限**: 确保 token 或 SSH 密钥有足够权限
3. **检查仓库**: 确保仓库确实存在且可访问

### 临时解决方案：
如果配置复杂，可以：
1. 临时将仓库设为公开
2. 完成部署测试
3. 再改回私有

## 验证步骤
1. 重新触发部署
2. 查看构建日志
3. 确认代码可以正常拉取
4. 检查服务是否正常启动 