# 小程序后端系统设计文档（RD）

## 1. 系统架构
- 前端：微信小程序，TDesign UI 框架。
- 后端：基于微信云开发（CloudBase）或Node.js云函数，RESTful API。
- 数据库：微信云开发数据库（MongoDB兼容）。
- 云存储：用于图片、头像等多媒体资源。
- 第三方服务：短信验证码、微信/QQ/钉钉等OAuth登录。

## 2. 数据库设计
### 2.1 主要集合（表）结构
#### content_cards（内容卡片表）
| 字段         | 类型      | 说明           |
| ------------ | --------- | -------------- |
| id           | string    | 唯一标识       |
| image        | string    | 图片fileID/URL |
| images       | [string]  | 多图fileID/URL |
| title        | string    | 标题           |
| desc         | string    | 描述           |
| tags         | [string]  | 标签ID数组     |
| authorId     | string    | 作者用户ID     |
| createdAt    | datetime  | 发布时间       |
| likeCount    | number    | 点赞数         |
| commentCount | number    | 评论数         |
| isFollowed   | boolean   | 是否已关注     |
| location     | object    | 位置（可选）   |
| status       | string    | 状态（draft/published）|

#### users（用户表）
| 字段         | 类型      | 说明           |
| ------------ | --------- | -------------- |
| id           | string    | 用户ID         |
| avatar       | string    | 头像fileID/URL |
| nickname     | string    | 昵称           |
| phone        | string    | 手机号         |
| email        | string    | 邮箱           |
| gender       | string    | 性别           |
| birth        | string    | 生日           |
| address      | string    | 地址           |
| introduction | string    | 个人简介       |
| createdAt    | datetime  | 注册时间       |

#### tags（标签表）
| 字段   | 类型    | 说明         |
| ------ | ------- | ------------ |
| id     | string  | 标签ID       |
| name   | string  | 标签名       |
| type   | string  | 标签类型（样式）|

#### user_follow（用户关注表）
| 字段      | 类型   | 说明         |
| --------- | ------ | ------------ |
| id        | string | 记录ID       |
| userId    | string | 用户ID       |
| followId  | string | 被关注用户ID |

#### messages（消息表）
| 字段        | 类型    | 说明         |
| ----------- | ------- | ------------ |
| id          | string  | 消息ID       |
| fromUser    | string  | 发送者ID     |
| toUser      | string  | 接收者ID     |
| content     | string  | 消息内容     |
| createdAt   | datetime| 发送时间     |
| isRead      | boolean | 是否已读     |

### 2.2 其他集合
- search_history（搜索历史）
- settings（用户设置）
- drafts（草稿箱，或用content_cards的status字段区分）

## 3. 主要接口设计
### 3.1 首页相关
- `GET /home/cards?type=recommend|follow&page=1`  
  返回内容卡片列表，支持推荐/关注、分页。
- `GET /home/swipers`  
  返回首页轮播图数据。
- `GET /tags`  
  获取所有标签。
- `GET /content/detail?id=xxx`  
  获取内容详情。

### 3.2 发布与草稿
- `POST /content/publish`  
  发布新内容。
- `POST /content/draft`  
  保存草稿。
- `GET /content/drafts`  
  获取用户草稿箱内容。
- `POST /upload/image`  
  图片上传，返回fileID。

### 3.3 搜索
- `GET /search/history`  
  获取用户历史搜索。
- `POST /search/history`  
  添加历史搜索。
- `DELETE /search/history`  
  删除历史搜索。
- `GET /search/popular`  
  获取热门搜索词。
- `GET /search?keyword=xxx`  
  内容检索。

### 3.4 用户与个人中心
- `GET /user/info`  
  获取用户信息。
- `POST /user/login`  
  用户登录/注册。
- `GET /user/content/stat`  
  获取内容统计。
- `GET /user/content/list?type=all|progress|published|draft`  
  获取内容列表。
- `GET /user/service`  
  获取客服信息。
- `GET /user/settings`  
  获取用户设置。
- `POST /user/settings`  
  更新用户设置。

### 3.5 消息/聊天
- `GET /message/list`  
  获取消息列表。
- `POST /message/read`  
  标记消息为已读。
- `GET /chat/history?userId=xxx`  
  获取聊天记录。
- `POST /chat/send`  
  发送消息。
- `GET /message/unreadCount`  
  获取未读消息数。

### 3.6 登录/注册
- `POST /auth/sendCode`  
  发送验证码。
- `POST /auth/verifyCode`  
  校验验证码，自动注册或登录。
- `POST /auth/login`  
  密码登录。
- `POST /auth/oauth`  
  第三方登录（微信）。

## 4. 模块划分
- 用户模块：注册、登录、信息管理、设置、关注。
- 内容模块：内容发布、草稿、卡片、详情、标签。
- 搜索模块：历史、热门、内容检索。
- 消息模块：消息列表、聊天、未读统计。
- 文件模块：图片上传、云存储。
- 设置模块：账号安全、隐私、通知等。

## 5. 数据流与交互
- 前端通过API与云函数/后端交互，所有数据均通过RESTful接口获取和提交。
- 图片等大文件通过云存储上传，返回fileID用于内容数据关联。
- 登录态通过token/session管理，接口需校验用户身份。

## 6. 权限与安全
- 所有涉及用户数据的接口需鉴权（如token校验）。
- 图片上传需校验文件类型和大小。
- 敏感操作（如内容发布、删除、设置修改）需校验用户权限。
- 支持HTTPS/小程序云开发安全机制。

## 7. 其他说明
- 标签体系、内容类型、设置项等建议支持后端动态扩展。
- 支持多端（小程序、H5、App）统一接口。
- 日志与监控建议集成云开发日志服务。

## 8. 内容详情页设计补充
- 详情页直接通过 content_cards 的 _id 查询，展示全部字段。
- 作者信息通过 authorId 关联 users 表。
- 评论区通过 comments 集合，互动通过 likes、favorites、user_follow 等集合。
- 推荐内容通过 tags、作者等字段做相关推荐。
- 所有新需求优先考虑在现有集合增补字段，不新建表。 