// 管理员配置
export default {
  // 管理员OpenID列表
  adminOpenIds: [
    // 在这里添加管理员的OpenID
    // 'your-admin-openid-here',
  ],
  
  // 检查是否为管理员
  isAdmin(openid) {
    return this.adminOpenIds.includes(openid);
  },
  
  // 添加管理员
  addAdmin(openid) {
    if (!this.adminOpenIds.includes(openid)) {
      this.adminOpenIds.push(openid);
    }
  },
  
  // 移除管理员
  removeAdmin(openid) {
    const index = this.adminOpenIds.indexOf(openid);
    if (index > -1) {
      this.adminOpenIds.splice(index, 1);
    }
  }
}; 