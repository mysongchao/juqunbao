# TDesign 通用页面模板

基于 TDesign 打造的通用页面模板，包含通用的登陆注册、个人中心、设置中心、信息流等等功能。

## 模版功能预览

### 首页

<div style="display: flex">
  <img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/home-1.png">
  <img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/home-2.png">
</div>

### 信息发布

<img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/publish-1.png">

### 搜索页

<img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/search-1.png">

### 个人中心
<div style="display: flex">
  <img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/user-1.png">
  <img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/user-2.png">
  <img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/user-3.png">
</div>


### 设置中心

<img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/setting-1.png">

### 消息中心

<img width="375" alt="image" src="https://tdesign.gtimg.com/miniprogram/template/message-1.png">


## 开发预览
### 目录结构（TODO: 生成目录结构树）


### 在开发者工具中预览

```bash
# 安装项目依赖
npm install

```

打开[微信开发者工具](https://mp.weixin.qq.com/debug/wxadoc/dev/devtools/download.html)，导入整个项目，构建 npm 包，就可以预览示例了。

### 基础库版本

最低基础库版本`^2.6.5`


## 贡献成员

<a href="https://github.com/TDesignOteam/tdesign-miniprogram-starter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=TDesignOteam/tdesign-miniprogram-starter" />
</a>

## 反馈

有任何问题，建议通过 [Github issues](https://github.com/TDesignOteam/tdesign-miniprogram-starter/issues) 反馈。

## 开源协议

TDesign 遵循 [MIT 协议](https://github.com/TDesignOteam/tdesign-miniprogram-starter/blob/main/LICENSE)。

# 小程序后端（云函数/数据库）需求清单
> 主要是后端需补齐上述所有接口及数据库设计，完成与前端的真实数据对接。

### 首页需求分析（补充版）

#### 1. 页面结构与核心功能
- 顶部搜索栏：支持内容检索，输入关键词后可跳转到搜索结果页。
- Tab切换：分为"推荐"和"我的关注"两个内容流。
- 加载中状态：内容加载时显示进度环和"加载中"提示，接口需支持分页和加载更多。
- 内容卡片瀑布流：每个卡片包含图片、标题、标签（如"AI绘画""版权素材"），支持多行展示。
- 底部导航栏：包含"首页""消息""我的"三个主入口，消息有未读数红点提示。
- 右下角悬浮发布按钮：点击可进入内容发布页。

#### 2. 首页内容卡片数据结构
每个内容卡片应包含如下字段（desc为可选）：
```json
{
  "id": "string",           // 唯一标识
  "image": "string",        // 图片URL或云存储fileID
  "title": "string",        // 标题，如"少年, 星空与梦想"
  "desc": "string",         // 简要描述（可选）
  "tags": [
    {
      "name": "string",     // 标签名
      "type": "string"      // 标签类型（如"primary"、"success"等，前端用于样式区分）
    }
  ],
  "author": {
    "id": "string",
    "name": "string",
    "avatar": "string"
  },
  "createdAt": "datetime",  // 发布时间
  "likeCount": "number",    // 点赞数
  "commentCount": "number", // 评论数
  "isFollowed": "boolean"   // 是否已关注作者
}
```

#### 3. 首页接口需求
- `GET /home/cards?type=recommend|follow&page=1`
  - 参数：type: 推荐/关注，page: 分页
  - 返回：卡片内容数组，分页信息，需支持加载中状态
- `GET /home/swipers`
  - 返回首页顶部轮播图数据（如有）
- 新增：`GET /content/detail?id=xxx`
  - 获取内容详情页数据

#### 4. 搜索功能需求
- 搜索栏输入后跳转到搜索页，需支持内容模糊检索。
- 需有接口支持关键词检索内容卡片。

#### 5. 标签体系
- 卡片下方的标签（如"AI绘画""版权素材"）需支持多标签，标签体系可由后端统一维护，前端可通过接口获取所有可用标签。
- 补充：标签需支持类型和样式区分，建议后端返回标签类型或样式字段。

#### 6. 图片资源
- 首页卡片图片需支持云存储fileID或URL，上传时需有图片上传接口，内容发布时需将图片fileID与内容数据关联。
- 设计稿中的图片可作为初始数据导入数据库，便于前端展示。

#### 7. 用户与关注
- "我的关注"Tab需根据当前用户的关注关系筛选内容，需有用户关注关系表与相关接口。

#### 8. 消息与未读数
- 底部"消息"Tab需有未读消息数接口，支持实时更新。

#### 9. 发布功能
- 右下角"+"发布按钮需跳转到内容发布页，发布内容需有后端接口支持。

---

##### 数据库表建议
1. content_cards（内容卡片表）
2. users（用户表）
3. tags（标签表，需包含type字段）
4. user_follow（用户关注表）
5. messages（消息表）

---

##### 首页后端接口一览
- `GET /home/cards`
- `GET /home/swipers`
- `GET /tags`
- `GET /user/followed`
- `GET /message/unreadCount`
- `POST /content/publish`
- `POST /upload/image`
- `GET /content/detail`

### 发布动态需求分析（补充版）

#### 1. 页面结构与核心功能
- 图片上传：支持多张图片上传与删除，最多上传数量需由后端/前端配置（如最多4张）。
- 添加描述：支持输入最多500字的文本描述，需有字数统计与限制。
- 添加标签：支持多标签选择，标签样式区分（如选中高亮），标签内容由后端统一维护。
- 添加位置：支持选择当前位置，需调用定位API，后端需支持存储地理位置信息。
- 存草稿：支持将当前内容保存为草稿，后端需有草稿箱管理接口。
- 发布：支持将内容正式发布，需校验必填项（如图片、描述、标签等）。

#### 2. 数据结构建议
```json
{
  "id": "string",             // 唯一标识
  "images": ["string"],       // 图片fileID数组
  "desc": "string",           // 描述内容
  "tags": ["string"],         // 标签ID或名称数组
  "location": {
    "name": "string",         // 位置名称
    "latitude": "number",     // 纬度
    "longitude": "number"     // 经度
  },
  "status": "draft|published",// 状态：草稿/已发布
  "authorId": "string",       // 用户ID
  "createdAt": "datetime"     // 创建时间
}
```

#### 3. 后端接口需求
- `POST /content/publish`
  - 参数：images, desc, tags, location, authorId
  - 功能：发布新内容
- `POST /content/draft`
  - 参数同上，status为draft
  - 功能：保存草稿
- `GET /content/drafts`
  - 参数：authorId
  - 功能：获取用户草稿箱内容
- `POST /upload/image`
  - 参数：file
  - 功能：图片上传，返回fileID
- `GET /tags`
  - 功能：获取所有可用标签
- `POST /location/resolve`
  - 参数：经纬度
  - 功能：根据经纬度解析位置名称（如需）

#### 4. 交互与校验
- 图片、描述、标签为必填项（可根据产品需求调整）。
- 发布前需校验必填项，未填写时需有前端提示。
- 草稿可随时保存，内容可多次编辑。
- 位置为可选项，若未授权定位可为空。

#### 5. 其他建议
- 标签体系建议后端可动态扩展，支持多种类型和样式。
- 图片上传需支持进度显示与失败重试。
- 草稿与已发布内容数据结构一致，仅status字段不同。

### 个人中心（我的）页面需求分析（补充版）

#### 1. 页面结构与核心功能
- 顶部用户信息区：
  - 未登录时显示"请先登录/注册"按钮，点击后跳转到登录/注册页。
  - 登录后显示用户头像、昵称、个人信息。
- 发布管理区：
  - 全部发布、审核中、已发布、草稿箱四个入口，点击后分别跳转到对应内容列表页。
- 客服与设置：
  - "联系客服"入口，点击后可弹出客服联系方式或跳转到客服聊天页。
  - "设置"入口，点击后进入设置中心。
- 底部导航栏：
  - "首页""消息""我的"三个主入口，消息有未读数红点提示。

#### 2. 数据结构建议
- 用户信息：
```json
{
  "id": "string",
  "avatar": "string",
  "nickname": "string",
  "phone": "string",
  "email": "string",
  "gender": "string",
  "birth": "string",
  "address": "string",
  "introduction": "string"
}
```
- 发布内容统计：
```json
{
  "all": "number",        // 全部发布数量
  "progress": "number",   // 审核中数量
  "published": "number",  // 已发布数量
  "draft": "number"       // 草稿箱数量
}
```

#### 3. 后端接口需求
- `GET /user/info`
  - 获取当前用户信息
- `POST /user/login`
  - 用户登录/注册
- `GET /user/content/stat`
  - 获取用户全部发布、审核中、已发布、草稿箱数量
- `GET /user/content/list?type=all|progress|published|draft`
  - 获取对应类型的内容列表
- `GET /user/service`
  - 获取客服信息
- `GET /user/settings`
  - 获取用户设置项
- `POST /user/settings`
  - 更新用户设置项

#### 4. 交互与校验
- 未登录状态下，所有内容管理入口点击需先跳转到登录页。
- 登录后可直接访问内容管理、客服、设置等功能。
- 客服入口可弹窗或跳转，支持多种联系方式（如在线客服、电话、微信等）。

#### 5. 其他建议
- 用户信息支持后端扩展（如实名认证、积分、等级等）。
- 内容管理入口支持红点或数量提示，便于用户快速了解内容状态。
- 设置中心建议支持账号安全、隐私、通知等常用设置项。

### 登录/注册页面需求分析（补充版）

#### 1. 页面结构与核心功能
- 手机号登录/注册：
  - 输入手机号，获取验证码，验证码通过后自动注册或登录。
  - 支持区号选择，默认+86。
  - 未注册手机号验证通过后自动注册。
- 协议勾选：
  - 登录/注册前需勾选同意《协议条款》，未勾选时按钮置灰不可用。
- 验证码登录：
  - 输入手机号后，点击"验证并登录"获取验证码并完成登录。
- 密码登录：
  - 支持切换到密码登录方式。
- 第三方登录：
  - 支持微信、QQ、钉钉等第三方快捷登录。
- 其他方式：
  - 可扩展更多登录方式。

#### 2. 数据结构建议
- 用户注册/登录信息：
```json
{
  "phone": "string",      // 手机号
  "countryCode": "+86",   // 区号
  "verifyCode": "string", // 验证码
  "password": "string",   // 密码（如有）
  "agree": true            // 是否同意协议
}
```

#### 3. 后端接口需求
- `POST /auth/sendCode`
  - 参数：phone, countryCode
  - 功能：发送验证码
- `POST /auth/verifyCode`
  - 参数：phone, countryCode, verifyCode
  - 功能：校验验证码，自动注册或登录
- `POST /auth/oauth`
  - 参数：type, code
  - 功能：第三方登录（微信）

#### 4. 交互与校验
- 手机号、验证码、协议勾选为必填项。
- 未勾选协议时，"验证并登录"按钮不可用。
- 验证码输入错误、手机号格式错误等需有前端提示。
- 第三方登录需引导用户授权。

#### 5. 其他建议
- 支持登录后自动跳转到上次访问页面或首页。
- 支持登录状态持久化（如token存储）。
- 支持多端（小程序、H5、App）统一登录逻辑。

### 内容详情页需求分析（补充版）

#### 1. 功能需求
- 首页卡片点击后进入内容详情页，展示完整内容、图片、标签、作者、统计数据。
- 支持评论区、点赞、收藏、关注作者、相关推荐。
- 详情页数据结构与首页卡片一致，优先利旧 content_cards、users 集合，仅在必要时增补字段。

#### 2. 数据结构建议
- 详情页内容直接复用 content_cards 字段，如需展示收藏数、浏览量，可增补 favoriteCount、viewCount 字段。
- 评论区可用 comments 集合，互动用 likes、favorites、user_follow 等集合。

#### 3. 推荐利旧说明
- 详情页、首页、搜索页等所有内容展示均优先复用 content_cards、users 集合，避免重复建表。
- 仅在有新需求时增补字段，不新建表。
