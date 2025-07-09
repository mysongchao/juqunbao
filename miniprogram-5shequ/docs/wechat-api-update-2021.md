# 微信用户信息接口调整说明

## 更新背景

根据微信团队2021-09-26发布的《微信公众平台用户信息相关接口调整公告》，微信对用户信息相关功能及接口进行了调整，以进一步规范开发者调用用户信息相关接口或功能，保障用户合法权益。

## 主要变更

### 1. 不再返回的字段

以下字段在获取用户信息时不再返回：

- `gender` - 用户性别
- `country` - 用户国家  
- `province` - 用户省份
- `city` - 用户城市

### 2. 仍然返回的字段

以下字段仍然正常返回：

- `nickName` - 用户昵称
- `avatarUrl` - 用户头像URL
- `language` - 用户语言

## 代码适配

### 前端适配

1. **移除对不再返回字段的依赖**
   - 不再检查 `gender`, `country`, `province`, `city` 字段
   - 更新用户信息完整性检查逻辑
   - 移除相关UI显示

2. **更新用户信息处理**
   ```javascript
   // 更新前
   const userInfo = {
     nickName: res.userInfo.nickName,
     avatarUrl: res.userInfo.avatarUrl,
     gender: res.userInfo.gender,
     country: res.userInfo.country,
     province: res.userInfo.province,
     city: res.userInfo.city,
     language: res.userInfo.language
   };
   
   // 更新后
   const userInfo = {
     nickName: res.userInfo.nickName,
     avatarUrl: res.userInfo.avatarUrl,
     language: res.userInfo.language
   };
   ```

### 后端适配

1. **数据库字段调整**
   - 用户表中移除 `gender`, `country`, `province`, `city` 字段
   - 更新用户信息存储逻辑

2. **云函数更新**
   - 更新用户信息处理逻辑
   - 移除对不再返回字段的处理

## 影响范围

### 功能影响

1. **用户信息显示**
   - 个人中心页面不再显示用户城市信息
   - 用户性别、地区信息无法获取

2. **数据存储**
   - 数据库中不再存储性别、地区信息
   - 历史数据中的相关字段将为空

### 兼容性

- 新用户：完全按照新接口处理
- 老用户：历史数据保留，新登录时不再更新相关字段

## 测试建议

1. **新用户注册测试**
   - 验证用户信息获取是否正常
   - 确认不再返回的字段确实为空

2. **老用户登录测试**
   - 验证历史数据是否正常显示
   - 确认新登录时不会覆盖历史数据

3. **UI显示测试**
   - 确认移除的字段在界面上不再显示
   - 验证页面布局是否正常

## 注意事项

1. **权限配置**
   - 确保小程序权限配置正确
   - 用户授权流程不受影响

2. **错误处理**
   - 保持对字段缺失的容错处理
   - 提供合理的默认值

3. **用户体验**
   - 向用户说明信息获取限制
   - 提供手动输入相关信息的选项（如需要）

## 相关文档

- [微信公众平台用户信息相关接口调整公告](https://developers.weixin.qq.com/community/develop/doc/000a02f2c502389ab2e7bc3a56b801)
- [小程序用户信息接口文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html) 