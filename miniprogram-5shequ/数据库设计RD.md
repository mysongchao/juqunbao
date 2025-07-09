# 小程序后端数据库设计文档（微信云开发数据库）

## 1. 设计原则
- 采用微信云开发数据库（集合/文档结构）。
- 结合小程序业务需求，设计高效、易扩展的数据结构。
- 充分利用微信云开发的安全规则、自动索引、云存储等特性。

## 2. 主要集合（Collection）设计

### 2.1 content_cards（内容卡片表）
| 字段         | 类型      | 必填 | 说明           |
| ------------ | --------- | ---- | -------------- |
| _id          | string    | Y    | 主键，自动生成 |
| image        | string    | N    | 主图fileID/URL |
| images       | [string]  | N    | 多图fileID/URL |
| title        | string    | Y    | 标题           |
| desc         | string    | N    | 描述           |
| tags         | [string]  | N    | 标签ID数组     |
| authorId     | string    | Y    | 作者用户ID     |
| createdAt    | date      | Y    | 发布时间       |
| likeCount    | number    | N    | 点赞数         |
| commentCount | number    | N    | 评论数         |
| isFollowed   | boolean   | N    | 是否已关注     |
| location     | object    | N    | 位置（name, latitude, longitude）|
| status       | string    | Y    | 状态（draft/published）|
| favoriteCount| number    | N    | 收藏数，默认0  |
| viewCount    | number    | N    | 浏览量，默认0  |

**索引建议**：
- authorId（用户内容查询）
- tags（标签筛选）
- createdAt（时间排序）
- status（草稿/已发布筛选）

**数据示例**：
```json
{
  "_id": "xxx",
  "image": "cloud://xxx/xxx.png",
  "images": ["cloud://xxx/xxx1.png", "cloud://xxx/xxx2.png"],
  "title": "少年, 星空与梦想",
  "desc": "AI绘画作品",
  "tags": ["ai", "copyright"],
  "authorId": "user123",
  "createdAt": new Date(),
  "likeCount": 10,
  "commentCount": 2,
  "isFollowed": false,
  "location": {"name": "上海", "latitude": 31.2, "longitude": 121.5},
  "status": "published",
  "favoriteCount": 0,
  "viewCount": 0
}
```

### 2.2 users（用户表）
| 字段         | 类型      | 必填 | 说明           |
| ------------ | --------- | ---- | -------------- |
| _id          | string    | Y    | 用户ID         |
| avatar       | string    | N    | 头像fileID/URL |
| nickname     | string    | N    | 昵称           |
| phone        | string    | N    | 手机号         |
| email        | string    | N    | 邮箱           |
| gender       | string    | N    | 性别           |
| birth        | string    | N    | 生日           |
| address      | string    | N    | 地址           |
| introduction | string    | N    | 个人简介       |
| createdAt    | date      | Y    | 注册时间       |

**索引建议**：
- phone（手机号唯一）
- nickname（模糊搜索）

**数据示例**：
```json
{
  "_id": "user123",
  "avatar": "cloud://xxx/avatar.png",
  "nickname": "小明",
  "phone": "13800000000",
  "email": "test@xx.com",
  "gender": "male",
  "birth": "2000-01-01",
  "address": "上海市",
  "introduction": "AI爱好者",
  "createdAt": new Date()
}
```

### 2.3 tags（标签表）
| 字段   | 类型    | 必填 | 说明         |
| ------ | ------- | ---- | ------------ |
| _id    | string  | Y    | 标签ID       |
| name   | string  | Y    | 标签名       |
| type   | string  | N    | 标签类型（样式）|

**索引建议**：
- name（唯一）

**数据示例**：
```json
{
  "_id": "ai",
  "name": "AI绘画",
  "type": "primary"
}
```

### 2.4 user_follow（用户关注表）
| 字段      | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| _id       | string | Y    | 记录ID       |
| userId    | string | Y    | 用户ID       |
| followId  | string | Y    | 被关注用户ID |
| createdAt | date   | Y    | 关注时间     |

**索引建议**：
- userId + followId（唯一复合索引）

**数据示例**：
```json
{
  "_id": "xxx",
  "userId": "user123",
  "followId": "user456",
  "createdAt": new Date()
}
```

### 2.5 messages（消息表）
| 字段        | 类型    | 必填 | 说明         |
| ----------- | ------- | ---- | ------------ |
| _id         | string  | Y    | 消息ID       |
| fromUser    | string  | Y    | 发送者ID     |
| toUser      | string  | Y    | 接收者ID     |
| content     | string  | Y    | 消息内容     |
| createdAt   | date    | Y    | 发送时间     |
| isRead      | boolean | N    | 是否已读     |

**索引建议**：
- fromUser + toUser + createdAt（会话查询、排序）
- toUser + isRead（未读消息统计）

**数据示例**：
```json
{
  "_id": "msg001",
  "fromUser": "user123",
  "toUser": "user456",
  "content": "你好！",
  "createdAt": new Date(),
  "isRead": false
}
```

### 2.6 search_history（搜索历史）
| 字段      | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| _id       | string | Y    | 记录ID       |
| userId    | string | Y    | 用户ID       |
| keyword   | string | Y    | 搜索关键词   |
| createdAt | date   | Y    | 搜索时间     |

**索引建议**：
- userId + keyword（唯一）
- createdAt（排序）

### 2.7 drafts（草稿箱）
- 建议直接用content_cards集合，status字段为"draft"。

### 2.8 settings（用户设置）
| 字段      | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| _id       | string | Y    | 记录ID       |
| userId    | string | Y    | 用户ID       |
| key       | string | Y    | 设置项key    |
| value     | any    | N    | 设置值       |

**索引建议**：
- userId + key（唯一）

### 2.9 comments（评论表）
| 字段       | 类型    | 必填 | 说明           |
| ---------- | ------- | ---- | -------------- |
| _id        | string  | Y    | 主键           |
| contentId  | string  | Y    | 关联内容ID     |
| userId     | string  | Y    | 评论用户ID     |
| content    | string  | Y    | 评论内容       |
| replyTo    | string  | N    | 回复评论ID     |
| createdAt  | date    | Y    | 评论时间       |
| likeCount  | number  | N    | 评论点赞数     |

**索引建议**：
- contentId（内容评论查询）
- userId（用户评论查询）
- replyTo（楼中楼）
- createdAt（排序）

**数据示例**：
```json
{
  "_id": "cmt001",
  "contentId": "xxx",
  "userId": "user123",
  "content": "很棒的作品！",
  "replyTo": null,
  "createdAt": new Date(),
  "likeCount": 2
}
```

### 2.10 likes（点赞表）
| 字段       | 类型    | 必填 | 说明           |
| ---------- | ------- | ---- | -------------- |
| _id        | string  | Y    | 主键           |
| userId     | string  | Y    | 用户ID         |
| contentId  | string  | Y    | 关联内容ID     |
| createdAt  | date    | Y    | 点赞时间       |

**索引建议**：
- userId + contentId（唯一复合索引）

**数据示例**：
```json
{
  "_id": "like001",
  "userId": "user123",
  "contentId": "xxx",
  "createdAt": new Date()
}
```

### 2.11 favorites（收藏表）
| 字段       | 类型    | 必填 | 说明           |
| ---------- | ------- | ---- | -------------- |
| _id        | string  | Y    | 主键           |
| userId     | string  | Y    | 用户ID         |
| contentId  | string  | Y    | 关联内容ID     |
| createdAt  | date    | Y    | 收藏时间       |

**索引建议**：
- userId + contentId（唯一复合索引）

**数据示例**：
```json
{
  "_id": "fav001",
  "userId": "user123",
  "contentId": "xxx",
  "createdAt": new Date()
}
```

## 3. 约束与说明
- 微信云开发数据库自动为 _id 建立唯一索引。
- 重要业务字段建议建立复合索引提升查询效率。
- 所有时间字段建议用Date类型，便于排序和区间查询。
- 图片、文件等资源统一用云存储fileID。
- 用户手机号、邮箱等敏感信息需加密存储。
- 可结合云开发安全规则，限制集合的读写权限。

## 4. 安全与扩展建议
- 结合云开发安全规则，按需开放集合权限（如仅本人可读写草稿、设置等）。
- 标签、设置项等建议支持动态扩展。
- 支持多端（小程序、H5、App）统一数据结构。

## 5. 附录：集合创建示例（云开发控制台/CLI）
```js
// 创建集合
wx.cloud.database().createCollection('content_cards')
// 插入文档
wx.cloud.database().collection('content_cards').add({
  data: { ... }
})
``` 