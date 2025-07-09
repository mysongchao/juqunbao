### 首页RD

#### 1. 页面结构与核心功能
- 顶部搜索栏：支持内容检索，输入关键词后可跳转到搜索结果页。
- Tab切换：分为"推荐"和"我的关注"两个内容流。
- 内容卡片瀑布流：每个卡片包含图片、标题、标签（如"AI绘画""版权素材"），支持多行展示。
- 底部导航栏：包含"首页""消息""我的"三个主入口，消息有未读数红点提示。
- 右下角悬浮发布按钮：点击可进入内容发布页。

#### 2. 首页内容卡片数据结构
每个内容卡片应包含如下字段：
```json
{
  "id": "string",           // 唯一标识
  "image": "string",        // 图片URL或云存储fileID
  "title": "string",        // 标题，如"少年, 星空与梦想"
  "desc": "string",         // 简要描述（如有）
  "tags": ["string"],       // 标签数组，如["AI绘画", "版权素材"]
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
  - 返回：卡片内容数组，分页信息
- `GET /home/swipers`
  - 返回首页顶部轮播图数据（如有）

#### 4. 搜索功能需求
- 搜索栏输入后跳转到搜索页，需支持内容模糊检索。
- 需有接口支持关键词检索内容卡片。

#### 5. 标签体系
- 卡片下方的标签（如"AI绘画""版权素材"）需支持多标签，标签体系可由后端统一维护，前端可通过接口获取所有可用标签。

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
3. tags（标签表）
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