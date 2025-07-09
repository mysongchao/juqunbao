Page({
  data: {
    detail: null,
    loading: true,
    error: null,
    comments: [],
    hotComments: [],
    commentInput: '',
    loadingComments: false,
    commentTotal: 0,
    commentPage: 1,
    currentUserId: '',
    commentPageSize: 10,
    replyTo: null,
    replyToUserName: '',
    isAdmin: false
  },
  
  onLoad(options) {
    console.log('[detail] onLoad 开始，参数:', options);
    if (options.id) {
      this.getDetail(options.id);
    } else {
      console.error('[detail] 缺少必要的 id 参数');
      this.setData({ 
        loading: false, 
        error: '缺少内容ID参数' 
      });
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
    }
  },
  
  async getDetail(id) {
    console.log('[detail] 开始获取详情，ID:', id);
    this.setData({ loading: true, error: null });
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getContentDetail',
        data: { 
          contentId: id, 
          userId: wx.getStorageSync('userId') 
        }
      });
      
      console.log('[detail] 云函数返回结果:', res);
      
      if (res.result && res.result.code === 0) {
        console.log('[detail] 详情获取成功:', res.result.data);
        this.setData({ 
          detail: res.result.data, 
          loading: false 
        });
        this.loadComments(id);
      } else {
        console.error('[detail] 云函数返回错误:', res.result);
        const errorMsg = res.result?.msg || '获取详情失败';
        this.setData({ 
          loading: false, 
          error: errorMsg 
        });
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('[detail] 调用云函数失败:', error);
      this.setData({ 
        loading: false, 
        error: '网络请求失败' 
      });
      wx.showToast({
        title: '网络请求失败',
        icon: 'none',
        duration: 3000
      });
    }
  },
  
  // 重试获取详情
  retry() {
    const id = this.options?.id;
    console.log('[detail] 点击重试按钮，当前 id:', id);
    if (id) {
      this.getDetail(id);
    } else {
      console.error('[detail] 重试时缺少 id');
    }
  },

  // 加载评论列表
  async loadComments(contentId, page = 1) {
    this.setData({ loadingComments: true });
    const res = await wx.cloud.callFunction({
      name: 'contentActions',
      data: {
        action: 'getComments',
        contentId,
        page,
        pageSize: this.data.commentPageSize
      }
    });
    const { hotComments = [], comments = [], total = 0 } = res.result;
    this.setData({
      hotComments,
      comments: page === 1 ? comments : this.data.comments.concat(comments),
      commentTotal: total,
      commentPage: page,
      loadingComments: false
    });
  },

  // 点赞/取消点赞
  async onLikeTap() {
    const { detail } = this.data;
    const userId = wx.getStorageSync('userId');
    const action = detail.isLiked ? 'unlike' : 'like';
    await wx.cloud.callFunction({
      name: 'contentActions',
      data: { action, contentId: detail._id, userId }
    });
    this.getDetail(detail._id);
  },

  // 收藏/取消收藏
  async onFavoriteTap() {
    const { detail } = this.data;
    const userId = wx.getStorageSync('userId');
    const action = detail.isFavorited ? 'unfavorite' : 'favorite';
    await wx.cloud.callFunction({
      name: 'contentActions',
      data: { action, contentId: detail._id, userId }
    });
    this.getDetail(detail._id);
  },

  // 评论输入
  onCommentInput(e) {
    let value = e.detail.value;
    if (value.length > 200) {
      value = value.slice(0, 200);
      wx.showToast({ title: '最多200字', icon: 'none' });
    }
    this.setData({ commentInput: value });
  },

  // 选择回复某条评论
  onReplyComment(e) {
    const { commentId, userName } = e.currentTarget.dataset;
    this.setData({ replyTo: commentId, replyToUserName: userName });
  },

  // 发送评论（支持回复）
  async onSendComment() {
    const content = this.data.commentInput.trim();
    if (!content) return wx.showToast({ title: '请输入内容', icon: 'none' });
    // 内容安全检测已临时关闭
    // const checkRes = await wx.cloud.callFunction({
    //   name: 'contentActions',
    //   data: { action: 'checkContent', content }
    // });
    // console.log('[checkContent] 云函数返回:', checkRes, 'result:', checkRes.result);
    // if (!checkRes.result.safe) {
    //   wx.showToast({ title: '内容含敏感词', icon: 'none' });
    //   return;
    // }
    wx.showLoading({ title: '发送中...' });
    await wx.cloud.callFunction({
      name: 'contentActions',
      data: {
        action: 'addComment',
        content,
        contentId: this.data.detail._id,
        replyTo: this.data.replyTo || '',
      }
    });
    wx.hideLoading();
    this.setData({ commentInput: '', replyTo: null, replyToUserName: '' });
    this.loadComments(this.data.detail._id, 1);
  },

  // 点赞评论
  async onLikeComment(e) {
    const { commentId } = e.currentTarget.dataset;
    await wx.cloud.callFunction({
      name: 'contentActions',
      data: { action: 'likeComment', commentId }
    });
    this.loadComments(this.data.detail._id, this.data.commentPage);
  },

  // 删除评论
  async onDeleteComment(e) {
    const { commentId } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: async (res) => {
        if (res.confirm) {
          await wx.cloud.callFunction({
            name: 'contentActions',
            data: { action: 'deleteComment', commentId }
          });
          this.loadComments(this.data.detail._id, 1);
        }
      }
    });
  },

  // 示例：关注按钮点击
  onFollowTap(e) {
    console.log('[detail] 关注按钮被点击，事件对象:', e);
    // 这里可以补充实际关注逻辑
    wx.showToast({ title: '关注功能开发中', icon: 'none' });
  },

  // 示例：评论按钮点击
  onCommentTap(e) {
    // 可聚焦评论输入框
    wx.showToast({ title: '请在下方输入评论', icon: 'none' });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadComments(this.data.detail._id, 1);
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    const comments = this.data.comments || [];
    if (comments.length < this.data.commentTotal) {
      this.loadComments(this.data.detail._id, this.data.commentPage + 1);
    }
  }
});

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return date.toLocaleDateString();
}

function highlightAtUser(content) {
  return content.replace(/(@[\w\u4e00-\u9fa5\-]+)/g, '<span class="at-user">$1</span>');
} 