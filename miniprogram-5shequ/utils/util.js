const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

// 复制到本地临时路径，方便预览
const getLocalUrl = (path, name) => {
  try {
    // 使用安全的文件复制方法
    const { getSafeLocalUrl } = require('./storage');
    return getSafeLocalUrl(path, name);
  } catch (error) {
    console.error('getLocalUrl error:', error);
    // 如果复制失败，返回原始路径
    return path;
  }
};

// 清理临时文件
const clearTempFiles = () => {
  try {
    const fs = wx.getFileSystemManager();
    const userDataPath = wx.env.USER_DATA_PATH;
    
    // 获取用户数据目录下的所有文件
    const files = fs.readdirSync(userDataPath);
    
    // 清理临时文件（可以根据需要调整清理策略）
    files.forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        try {
          fs.unlinkSync(`${userDataPath}/${file}`);
          console.log(`Cleaned temp file: ${file}`);
        } catch (e) {
          console.warn(`Failed to delete temp file: ${file}`, e);
        }
      }
    });
  } catch (error) {
    console.error('clearTempFiles error:', error);
  }
};

// 获取存储空间使用情况
const getStorageInfo = () => {
  try {
    return wx.getStorageInfoSync();
  } catch (error) {
    console.error('getStorageInfo error:', error);
    return null;
  }
};

module.exports = {
  formatTime,
  getLocalUrl,
  clearTempFiles,
  getStorageInfo,
};
