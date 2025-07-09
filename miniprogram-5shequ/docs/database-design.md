### 用户表 (users)

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| _id | String | 用户ID (自动生成) | "user_123456" |
| openid | String | 微信openid | "oWx123456789" |
| unionid | String | 微信unionid (可选) | "union_123456" |
| nickname | String | 用户昵称 | "张三" |
| avatar | String | 用户头像URL | "https://..." |
| language | String | 用户语言 | "zh_CN" |
| createdAt | Date | 创建时间 | 2024-01-01 10:00:00 |
| updatedAt | Date | 更新时间 | 2024-01-01 10:00:00 |
| lastLoginAt | Date | 最后登录时间 | 2024-01-01 10:00:00 |
| status | String | 用户状态 | "active" |

**注意：** 根据微信2021-09-26公告，以下字段已不再返回：
- gender (用户性别)
- country (用户国家)  
- province (用户省份)
- city (用户城市) 