/**
 * 智能截断字符串，支持中英文混排
 * @param {string} str 原始字符串
 * @param {number} maxLen 最大“汉字”长度（英文算0.5）
 * @param {boolean} showEllipsis 是否显示 ...，默认 true
 * @returns {string} 截断后字符串
 */
function smartTruncate(str, maxLen = 20, showEllipsis = true) {
  let len = 0;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (/[\u4e00-\u9fa5]/.test(char)) {
      len += 1;
    } else {
      len += 0.5;
    }
    if (len > maxLen) break;
    result += char;
  }
  if ((len > maxLen || str.length > result.length) && showEllipsis) {
    result += '...';
  }
  return result;
}

module.exports = {
  smartTruncate,
};