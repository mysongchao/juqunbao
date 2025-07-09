# 小程序后端接口文档（RD）

## 1. 首页相关

### 1.1 获取内容卡片列表
- **接口**：`GET /home/cards`
- **参数**：
  - type: string 推荐|follow（内容流类型）
  - page: number 页码
  - pageSize: number 每页数量（可选，默认20）
- **返回**：
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "_id": "xxx",
        "image": "cloud://xxx/xxx.png",
        "title": "少年, 星空与梦想",
        "desc": "AI绘画作品",
        "tags": ["ai", "copyright"],
        "authorId": "user123",
        "createdAt": "2024-06-01T12:00:00Z",
        "likeCount": 10,
        "commentCount": 2,
        "isFollowed": false,
        "status": "published"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```
- **权限**：公开

### 1.2 获取首页轮播图
- **接口**：`GET /home/swipers`
- **参数**：无
- **返回**：
```json
{
  "code": 0,
  "data": [
    { "image": "cloud://xxx/swiper1.png", "link": "/pages/detail?id=xxx" }
  ]
}
```
- **权限**：公开

### 1.3 获取标签列表
- **接口**：`GET /tags`
- **参数**：无
- **返回**：
```json
{
  "code": 0,
  "data": [
    { "_id": "ai", "name": "AI绘画", "type": "primary" }
  ]
}
```
- **权限**：公开

### 1.4 获取内容详情（补充说明）
- **接口**：`GET /content/detail`
- **参数**：
  - id: string 内容ID
- **返回**：
```json
{
  "code": 0,
  "data": {
    "_id": "xxx",
    "image": "cloud://xxx/xxx.png",
    "images": ["cloud://xxx/xxx1.png"],
    "title": "少年, 星空与梦想",
    "desc": "AI绘画作品",
    "tags": ["ai", "copyright"],
    "authorId": "user123",
    "createdAt": "2024-06-01T12:00:00Z",
    "likeCount": 10,
    "favoriteCount": 5,
    "viewCount": 100,
    "commentCount": 2,
    "isFollowed": false,
    "status": "published"
  }
}
```
- **说明**：如需展示收藏数、浏览量等，可在 content_cards 增补 favoriteCount、viewCount 字段。
- **权限**：公开

## 2. 发布与草稿

### 2.1 发布新内容
- **接口**：`POST /content/publish`
- **参数**（JSON）：
  - images: [string] 图片fileID数组
  - title: string 标题
  - desc: string 描述
  - tags: [string] 标签ID数组
  - location: object 位置（可选）
  - authorId: string 用户ID
- **返回**：
```json
{ "code": 0, "msg": "success", "data": { "_id": "xxx" } }
```
- **权限**：需登录

### 2.2 保存草稿
- **接口**：`POST /content/draft`
- **参数**：同上，status为draft
- **返回**：同上
- **权限**：需登录

### 2.3 获取草稿箱
- **接口**：`GET /content/drafts`
- **参数**：
  - authorId: string 用户ID
- **返回**：同1.1
- **权限**：需登录，仅本人可查

### 2.4 图片上传
- **接口**：`POST /upload/image`
- **参数**：form-data，file字段为图片文件
- **返回**：
```json
{ "code": 0, "data": { "fileID": "cloud://xxx/xxx.png" } }
```
- **权限**：需登录

## 3. 搜索

### 3.1 获取搜索历史
- **接口**：`GET /search/history`
- **参数**：userId: string
- **返回**：
```json
{ "code": 0, "data": [ { "keyword": "AI绘画", "createdAt": "2024-06-01T12:00:00Z" } ] }
```
- **权限**：需登录，仅本人可查

### 3.2 添加搜索历史
- **接口**：`POST /search/history`
- **参数**：userId, keyword
- **返回**：{ "code": 0, "msg": "success" }
- **权限**：需登录

### 3.3 删除搜索历史
- **接口**：`DELETE /search/history`
- **参数**：userId, keyword
- **返回**：{ "code": 0, "msg": "success" }
- **权限**：需登录

### 3.4 获取热门搜索
- **接口**：`GET /search/popular`
- **参数**：无
- **返回**：
```json
{ "code": 0, "data": [ { "keyword": "AI绘画", "count": 100 } ] }
```
- **权限**：公开

### 3.5 内容检索
- **接口**：`GET /search`
- **参数**：keyword: string
- **返回**：同1.1
- **权限**：公开

## 4. 用户与个人中心

### 4.1 获取用户信息
- **接口**：`GET /user/info`
- **参数**：userId: string
- **返回**：
```json
{
  "code": 0,
  "data": {
    "_id": "user123",
    "avatar": "cloud://xxx/avatar.png",
    "nickname": "小明",
    "phone": "13800000000",
    "email": "test@xx.com",
    "gender": "male",
    "birth": "2000-01-01",
    "address": "上海市",
    "introduction": "AI爱好者",
    "createdAt": "2024-06-01T12:00:00Z"
  }
}
```
- **权限**：需登录

### 4.2 用户登录/注册
- **接口**：`POST /user/login`
- **参数**：phone, verifyCode 或 password
- **返回**：
```json
{ "code": 0, "msg": "success", "data": { "token": "xxx", "userId": "user123" } }
```
- **权限**：公开

### 4.3 获取内容统计
- **接口**：`GET /user/content/stat`
- **参数**：userId
- **返回**：
```json
{ "code": 0, "data": { "all": 10, "progress": 2, "published": 6, "draft": 2 } }
```
- **权限**：需登录

### 4.4 获取内容列表
- **接口**：`GET /user/content/list`
- **参数**：userId, type: all|progress|published|draft
- **返回**：同1.1
- **权限**：需登录，仅本人可查

### 4.5 获取客服信息
- **接口**：`GET /user/service`
- **参数**：无
- **返回**：
```json
{ "code": 0, "data": { "wechat": "客服微信号", "phone": "400-xxx-xxxx" } }
```
- **权限**：公开

### 4.6 获取/更新用户设置
- **接口**：`GET /user/settings` `POST /user/settings`
- **参数**：userId, key, value
- **返回**：
```json
{ "code": 0, "data": { "key": "通知设置", "value": true } }
```
- **权限**：需登录，仅本人可查

## 5. 消息/聊天

### 5.1 获取消息列表
- **接口**：`GET /message/list`
- **参数**：userId
- **返回**：
```json
{ "code": 0, "data": [ { "fromUser": "user456", "content": "你好！", "createdAt": "2024-06-01T12:00:00Z", "isRead": false } ] }
```
- **权限**：需登录，仅本人可查

### 5.2 标记消息为已读
- **接口**：`POST /message/read`
- **参数**：userId, messageId
- **返回**：{ "code": 0, "msg": "success" }
- **权限**：需登录

### 5.3 获取聊天记录
- **接口**：`GET /chat/history`
- **参数**：userId, toUserId
- **返回**：同5.1
- **权限**：需登录，仅本人可查

### 5.4 发送消息
- **接口**：`POST /chat/send`
- **参数**：fromUser, toUser, content
- **返回**：{ "code": 0, "msg": "success" }
- **权限**：需登录

### 5.5 获取未读消息数
- **接口**：`GET /message/unreadCount`
- **参数**：userId
- **返回**：{ "code": 0, "data": 2 }
- **权限**：需登录

## 6. 登录/注册

### 6.1 发送验证码
- **接口**：`POST /auth/sendCode`
- **参数**：phone, countryCode
- **返回**：{ "code": 0, "msg": "success" }
- **权限**：公开

### 6.2 校验验证码
- **接口**：`POST /auth/verifyCode`
- **参数**：phone, countryCode, verifyCode
- **返回**：{ "code": 0, "msg": "success", "data": { "token": "xxx", "userId": "user123" } }
- **权限**：公开

### 6.3 密码登录
- **接口**：`POST /auth/login`
- **参数**：phone, password
- **返回**：{ "code": 0, "msg": "success", "data": { "token": "xxx", "userId": "user123" } }
- **权限**：公开

### 6.4 第三方登录
- **接口**：`POST /auth/oauth`
- **参数**：type, code
- **返回**：{ "code": 0, "msg": "success", "data": { "token": "xxx", "userId": "user123" } }
- **权限**：公开

## 7. 评论与互动相关接口（补充）

### 7.1 评论相关
- **接口**：`GET /comment/list`
  - 参数：contentId, page, pageSize
  - 返回：评论列表、总数
- **接口**：`POST /comment/add`
  - 参数：contentId, content, replyTo（可选）
  - 返回：{ code, msg, data: { _id } }
- **接口**：`POST /comment/like`
  - 参数：commentId
  - 返回：{ code, msg }

### 7.2 点赞/收藏相关
- **接口**：`POST /content/like`
  - 参数：contentId, action: like|unlike
  - 返回：{ code, msg }
- **接口**：`POST /content/favorite`
  - 参数：contentId, action: favorite|unfavorite
  - 返回：{ code, msg } 