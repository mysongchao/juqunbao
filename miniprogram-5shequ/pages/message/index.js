/**
 * @file pages/message/index.js
 * @description 消息列表页面逻辑，包括消息拉取、socket消息处理、未读数统计、跳转聊天页等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - 拉取消息列表
 * - 处理 socket 实时消息
 * - 统计未读消息数
 * - 跳转到聊天页并标记已读
 *
 * 调用关系：页面 onLoad 时自动拉取消息，socket 推送实时处理，用户操作触发相关方法
 */
// pages/message/message.js
import { fetchMessageList, markMessagesRead } from '../../mock/chat';

const app = getApp();
const { socket } = app.globalData; // 获取已连接的 socketTask
let currentUser = null; // 当前打开的聊天用户 { userId, eventChannel }

Page({
  /** 页面的初始数据 */
  data: {
    messageList: [], // 完整消息列表 { userId, name, avatar, messages }
    loading: true, // 是否正在加载（用于下拉刷新）
  },

  /** 生命周期函数--监听页面加载 */
  onLoad(options) {
    console.log('[message] 页面加载，options:', options);
    this.getMessageList();
    // 处理接收到的数据
    socket.onMessage((data) => {
      console.log('[message] 收到 socket 消息:', data);
      try {
      data = JSON.parse(data);
      if (data.type === 'message') {
        const { userId, message } = data.data;
        const { user, index } = this.getUserById(userId);
        this.data.messageList.splice(index, 1);
        this.data.messageList.unshift(user);
        user.messages.push(message);
        if (currentUser && userId === currentUser.userId) {
          this.setMessagesRead(userId);
          currentUser.eventChannel.emit('update', user);
        }
        this.setData({ messageList: this.data.messageList });
        app.setUnreadNum(this.computeUnreadNum());
          console.log('[message] 新消息已处理:', message);
        }
      } catch (err) {
        console.error('[message] 处理 socket 消息失败:', err);
      }
    });
  },

  /** 生命周期函数--监听页面初次渲染完成 */
  onReady() {},

  /** 生命周期函数--监听页面显示 */
  onShow() {
    currentUser = null;
  },

  /** 生命周期函数--监听页面隐藏 */
  onHide() {},

  /** 生命周期函数--监听页面卸载 */
  onUnload() {},

  /** 页面相关事件处理函数--监听用户下拉动作 */
  onPullDownRefresh() {},

  /** 页面上拉触底事件的处理函数 */
  onReachBottom() {},

  /** 用户点击右上角分享 */
  onShareAppMessage() {},

  /** 获取完整消息列表 */
  getMessageList() {
    console.log('[message] 开始拉取消息列表');
    fetchMessageList()
      .then(({ data }) => {
        console.log('[message] 拉取消息列表成功，条数:', data.length);
      this.setData({ messageList: data, loading: false });
      })
      .catch((err) => {
        console.error('[message] 拉取消息列表失败:', err);
        this.setData({ loading: false });
        wx.showToast({ title: '消息加载失败', icon: 'none' });
    });
  },

  /** 通过 userId 获取 user 对象和下标 */
  getUserById(userId) {
    let index = 0;
    while (index < this.data.messageList.length) {
      const user = this.data.messageList[index];
      if (user.userId === userId) return { user, index };
      index += 1;
    }
    // TODO：处理 userId 在列表中不存在的情况（）
  },

  /** 计算未读消息数量 */
  computeUnreadNum() {
    let unreadNum = 0;
    this.data.messageList.forEach(({ messages }) => {
      unreadNum += messages.filter((item) => !item.read).length;
    });
    return unreadNum;
  },

  /** 打开对话页 */
  toChat(event) {
    const { userId } = event.currentTarget.dataset;
    console.log('[message] 跳转到聊天页，userId:', userId);
    wx.navigateTo({ url: `/pages/chat/index?userId=${userId}` })
      .then(({ eventChannel }) => {
      currentUser = { userId, eventChannel };
      const { user } = this.getUserById(userId);
      eventChannel.emit('update', user);
      })
      .catch((err) => {
        console.error('[message] 跳转聊天页失败:', err);
        wx.showToast({ title: '无法进入聊天', icon: 'none' });
    });
    this.setMessagesRead(userId);
  },

  /** 将用户的所有消息标记为已读 */
  setMessagesRead(userId) {
    console.log('[message] 标记消息已读，userId:', userId);
    try {
    const { user } = this.getUserById(userId);
    user.messages.forEach((message) => {
      message.read = true;
    });
    this.setData({ messageList: this.data.messageList });
    app.setUnreadNum(this.computeUnreadNum());
    markMessagesRead(userId);
      console.log('[message] 消息已标记为已读');
    } catch (err) {
      console.error('[message] 标记消息已读失败:', err);
    }
  },
});
