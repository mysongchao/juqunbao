import request from '../../api/request';
import { cloudRequest } from '../../api/request';
const { smartTruncate } = require('../../utils/stringUtil');

const PLACEHOLDER_IMG = '/static/home/card0.png'; // 默认占位图

Page({
  data: {
    historyWords: [],
    popularWords: [],
    searchValue: '',
    dialog: {
      title: '确认删除当前历史记录',
      showCancelButton: true,
      message: '',
    },
    dialogShow: false,
    searchResults: [],
    searchPage: 1,
    searchPageSize: 20,
    searchTotal: 0,
    loadingMore: false,
    recommendList: [], // 首页精选内容
  },

  deleteType: 0,
  deleteIndex: '',

  onShow() {
    this.queryHistory();
    this.queryPopular();
  },

  async onLoad() {
    // 加载首页精选内容
    await this.loadRecommend();
  },

  async loadRecommend() {
    try {
      const res = await cloudRequest({
        name: 'home',
        data: { type: 'getCards', flowType: 'recommend', page: 1, pageSize: 6 }
      });
      if (res.code === 0 && res.data && Array.isArray(res.data.list)) {
        // 推荐区块也处理图片和标签
        const processed = res.data.list.map(item => ({
          ...item,
          url: (item.images && item.images.length > 0) ? item.images[0] : PLACEHOLDER_IMG,
          tags: this.formatTags(item.tags)
        }));
        this.setData({ recommendList: processed });
      }
    } catch (err) {}
  },

  /**
   * 查询历史记录
   * @returns {Promise<void>}
   */
  async queryHistory() {
    console.log('[search] 开始查询历史记录');
    try {
      const res = await cloudRequest({ name: 'search', data: { type: 'getHistory' } });
      if (res.code === 0 && Array.isArray(res.data)) {
        // 最多只显示10条历史记录
        const historyWords = res.data.map(item => item.keyword).slice(0, 10);
        this.setData({ historyWords });
        console.log('[search] 历史记录获取成功:', historyWords);
      } else {
        wx.showToast({ title: '历史记录获取失败', icon: 'none' });
      }
    } catch (err) {
      console.error('[search] 历史记录获取异常:', err);
      wx.showToast({ title: '历史记录获取失败', icon: 'none' });
    }
  },

  /**
   * 查询热门搜索
   * @returns {Promise<void>}
   */
  async queryPopular() {
    console.log('[search] 开始查询热门搜索');
    request('/api/searchPopular')
      .then((res) => {
      const { code, data } = res;
      if (code === 200) {
        const { popularWords = [] } = data;
          this.setData({ popularWords });
          console.log('[search] 热门搜索获取成功:', popularWords);
        } else {
          console.warn('[search] 热门搜索接口返回异常:', res);
          wx.showToast({ title: '热门搜索获取失败', icon: 'none' });
      }
      })
      .catch((err) => {
        console.error('[search] 热门搜索获取异常:', err);
        wx.showToast({ title: '热门搜索获取失败', icon: 'none' });
    });
  },

  async addHistoryWord(keyword) {
    if (!keyword) return;
    try {
      await cloudRequest({ name: 'search', data: { type: 'addHistory', keyword } });
      this.queryHistory();
    } catch (err) {
      console.error('[search] 添加历史失败:', err);
    }
  },

  async deleteHistory(keyword) {
    try {
      await cloudRequest({ name: 'search', data: { type: 'deleteHistory', keyword } });
      this.queryHistory();
    } catch (err) {
      console.error('[search] 删除历史失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  async clearAllHistory() {
    try {
      await cloudRequest({ name: 'search', data: { type: 'deleteHistory' } });
      this.queryHistory();
    } catch (err) {
      console.error('[search] 清空历史失败:', err);
      wx.showToast({ title: '清空失败', icon: 'none' });
    }
  },

  setHistoryWords(searchValue) {
    console.log('[search] 设置历史关键词:', searchValue);
    if (!searchValue) return;
    this.addHistoryWord(searchValue);
    this.setData({ searchValue });
    this.searchContent(searchValue);
  },

  /**
   * 清空历史记录的再次确认框
   * 后期可能需要增加一个向后端请求的接口
   * @returns {Promise<void>}
   */
  confirm() {
    const { historyWords } = this.data;
    const { deleteType, deleteIndex } = this;
    console.log('[search] 确认删除历史，类型:', deleteType, '索引:', deleteIndex);
    if (deleteType === 0) {
      const keyword = historyWords[deleteIndex];
      this.deleteHistory(keyword);
      this.setData({ dialogShow: false });
    } else {
      this.clearAllHistory();
      this.setData({ dialogShow: false });
    }
  },

  /**
   * 取消清空历史记录
   * @returns {Promise<void>}
   */
  close() {
    this.setData({ dialogShow: false });
  },

  /**
   * 点击清空历史记录
   * @returns {Promise<void>}
   */
  handleClearHistory() {
    console.log('[search] 点击清空历史记录');
    const { dialog } = this.data;
    this.deleteType = 1;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除所有历史记录',
      },
      dialogShow: true,
    });
  },

  deleteCurr(e) {
    const { index } = e.currentTarget.dataset;
    const { dialog } = this.data;
    this.deleteIndex = index;
    this.deleteType = 0;
    this.setData({
      dialog: {
        ...dialog,
        message: '确认删除当前历史记录',
      },
      dialogShow: true,
    });
  },

  /**
   * 点击关键词跳转搜索
   * 后期需要增加跳转和后端请求接口
   * @returns {Promise<void>}
   */
  handleHistoryTap(e) {
    const { historyWords } = this.data;
    const { index } = e.currentTarget.dataset;
    const searchValue = historyWords[index || 0] || '';
    this.setData({ searchValue });
    this.setHistoryWords(searchValue);
    this.searchContent(searchValue);
  },

  handlePopularTap(e) {
    const { popularWords } = this.data;
    const { index } = e.currentTarget.dataset;
    const searchValue = popularWords[index || 0] || '';
    this.setData({ searchValue });
    this.setHistoryWords(searchValue);
    this.searchContent(searchValue);
  },

  /**
   * 提交搜索框内容
   */
  handleSubmit(e) {
    const { value } = e.detail;
    if (value.length === 0) return;
    this.setHistoryWords(value);
  },

  /**
   * 点击取消回到主页
   * @returns {Promise<void>}
   */
  actionHandle() {
    this.setData({
      searchValue: '',
    });
    wx.switchTab({ url: '/pages/home/index' });
  },

  transformCardData(rawData) {
    return rawData.map(item => ({
      ...item,
      desc: smartTruncate(item.desc || '')
    }));
  },

  formatTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag => {
      if (typeof tag === 'string') {
        return { text: tag, theme: 'primary' };
      } else if (typeof tag === 'object' && tag.text) {
        return { text: tag.text, theme: tag.theme || 'primary' };
      } else {
        return { text: String(tag), theme: 'primary' };
      }
    });
  },

  /**
   * 内容搜索逻辑
   */
  async searchContent(keyword, page = 1) {
    if (!keyword) return;
    if (page === 1) wx.showLoading({ title: '搜索中...' });
    this.setData({ loadingMore: true });
    try {
      const res = await cloudRequest({
        name: 'search',
        data: { type: 'searchContent', keyword, page, pageSize: this.data.searchPageSize }
      });
      if (page === 1) wx.hideLoading();
      const list = res.code === 0 && res.data && Array.isArray(res.data.list) ? res.data.list : [];
      // 高亮关键词
      const highlight = (text) => {
        if (!text) return '';
        const reg = new RegExp(this.data.searchValue, 'ig');
        return text.replace(reg, match => `<span style=\"color:#0052d9\">${match}</span>`);
      };
      const processed = list.map(item => ({
        ...item,
        url: (item.images && item.images.length > 0) ? item.images[0] : PLACEHOLDER_IMG,
        desc: highlight(item.desc),
        title: highlight(item.title),
        tags: this.formatTags(item.tags)
      }));
      if (page === 1) {
        this.setData({ searchResults: processed, searchPage: 1, searchTotal: res.data.total || processed.length });
      } else {
        this.setData({ searchResults: this.data.searchResults.concat(processed), searchPage: page });
      }
    } catch (err) {
      if (page === 1) wx.hideLoading();
      wx.showToast({ title: '搜索失败', icon: 'none' });
      if (page === 1) this.setData({ searchResults: [] });
    }
    this.setData({ loadingMore: false });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  },

  // 下拉加载更多
  async onReachBottom() {
    if (this.data.loadingMore) return;
    if (this.data.searchResults.length < this.data.searchTotal) {
      await this.searchContent(this.data.searchValue, this.data.searchPage + 1);
    }
  },

  // 搜索框输入变化，清空时恢复历史/热门区块
  onInput(e) {
    const value = e.detail.value;
    this.setData({ searchValue: value });
    if (!value) {
      this.setData({ searchResults: [], searchTotal: 0, searchPage: 1 });
    }
  },
});
