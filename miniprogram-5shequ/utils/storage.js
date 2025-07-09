/**
 * 存储管理工具
 * 用于管理微信小程序的文件存储空间
 */

// 获取存储信息
const getStorageInfo = () => {
  try {
    return wx.getStorageInfoSync();
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return null;
  }
};

// 获取文件系统管理器
const getFileSystemManager = () => {
  return wx.getFileSystemManager();
};

// 清理临时文件
const clearTempFiles = () => {
  try {
    const fs = getFileSystemManager();
    const userDataPath = wx.env.USER_DATA_PATH;
    
    // 获取用户数据目录下的所有文件
    const files = fs.readdirSync(userDataPath);
    
    let cleanedCount = 0;
    
    // 清理临时文件
    files.forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif')) {
        try {
          fs.unlinkSync(`${userDataPath}/${file}`);
          cleanedCount++;
          console.log(`已清理临时文件: ${file}`);
        } catch (e) {
          console.warn(`清理文件失败: ${file}`, e);
        }
      }
    });
    
    console.log(`临时文件清理完成，共清理 ${cleanedCount} 个文件`);
    return cleanedCount;
  } catch (error) {
    console.error('清理临时文件失败:', error);
    return 0;
  }
};

// 检查存储空间
const checkStorageSpace = () => {
  const storageInfo = getStorageInfo();
  if (!storageInfo) {
    return { hasSpace: false, message: '无法获取存储信息' };
  }
  
  const usageRatio = storageInfo.currentSize / storageInfo.limitSize;
  const hasSpace = usageRatio < 0.9; // 90% 阈值
  
  return {
    hasSpace,
    usageRatio,
    currentSize: storageInfo.currentSize,
    limitSize: storageInfo.limitSize,
    message: hasSpace ? '存储空间充足' : '存储空间不足'
  };
};

// 安全的文件复制
const safeCopyFile = (srcPath, destPath) => {
  try {
    const fs = getFileSystemManager();
    
    // 检查目标文件是否已存在
    try {
      fs.accessSync(destPath);
      return destPath; // 文件已存在，直接返回
    } catch (e) {
      // 文件不存在，需要复制
    }
    
    // 检查存储空间
    const spaceCheck = checkStorageSpace();
    if (!spaceCheck.hasSpace) {
      console.warn('存储空间不足，清理临时文件');
      clearTempFiles();
      
      // 再次检查空间
      const retryCheck = checkStorageSpace();
      if (!retryCheck.hasSpace) {
        throw new Error('存储空间不足，无法复制文件');
      }
    }
    
    // 执行文件复制
    fs.copyFileSync(srcPath, destPath);
    return destPath;
  } catch (error) {
    console.error('文件复制失败:', error);
    throw error;
  }
};

// 获取安全的本地URL
const getSafeLocalUrl = (path, name) => {
  try {
    const destPath = `${wx.env.USER_DATA_PATH}/${name}`;
    return safeCopyFile(path, destPath);
  } catch (error) {
    console.error('获取本地URL失败:', error);
    // 如果复制失败，返回原始路径
    return path;
  }
};

// 清理所有存储
const clearAllStorage = () => {
  try {
    // 清理临时文件
    const tempCleaned = clearTempFiles();
    
    // 清理本地存储
    wx.clearStorageSync();
    
    console.log(`存储清理完成，临时文件: ${tempCleaned} 个`);
    return { tempCleaned, storageCleared: true };
  } catch (error) {
    console.error('清理存储失败:', error);
    return { tempCleaned: 0, storageCleared: false, error };
  }
};

module.exports = {
  getStorageInfo,
  clearTempFiles,
  checkStorageSpace,
  safeCopyFile,
  getSafeLocalUrl,
  clearAllStorage,
}; 