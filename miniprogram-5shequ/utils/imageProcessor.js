/**
 * 图片处理和压缩工具
 * 支持图片压缩、格式转换、质量优化和批量处理
 */

import { logger } from './logger';

// 图片处理配置
const IMAGE_CONFIG = {
  // 默认压缩质量
  defaultQuality: 0.8,
  
  // 最大文件大小（字节）
  maxFileSize: 5 * 1024 * 1024, // 5MB
  
  // 支持的图片格式
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  
  // 压缩配置
  compression: {
    // 不同尺寸的压缩质量
    qualityBySize: {
      small: 0.9,    // < 100KB
      medium: 0.8,   // 100KB - 1MB
      large: 0.7     // > 1MB
    },
    
    // 最大尺寸
    maxWidth: 1920,
    maxHeight: 1080
  }
};

// 图片处理器类
class ImageProcessor {
  constructor(config = {}) {
    this.config = { ...IMAGE_CONFIG, ...config };
  }

  // 获取图片信息
  getImageInfo(filePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success: (res) => {
          logger.info('获取图片信息成功', {
            path: filePath,
            width: res.width,
            height: res.height,
            type: res.type
          }, 'ImageProcessor');
          resolve(res);
        },
        fail: (error) => {
          logger.error('获取图片信息失败', { path: filePath, error }, 'ImageProcessor');
          reject(error);
        }
      });
    });
  }

  // 压缩图片
  async compressImage(filePath, options = {}) {
    const {
      quality = this.config.defaultQuality,
      maxWidth = this.config.compression.maxWidth,
      maxHeight = this.config.compression.maxHeight,
      format = 'jpg'
    } = options;

    try {
      // 获取图片信息
      const imageInfo = await this.getImageInfo(filePath);
      
      // 计算压缩后的尺寸
      const { width, height } = this.calculateDimensions(
        imageInfo.width,
        imageInfo.height,
        maxWidth,
        maxHeight
      );

      // 执行压缩
      const compressedPath = await this.compressImageFile(filePath, {
        quality,
        width,
        height,
        format
      });

      // 获取压缩后的文件信息
      const compressedInfo = await this.getFileInfo(compressedPath);
      
      logger.info('图片压缩成功', {
        originalPath: filePath,
        compressedPath,
        originalSize: imageInfo.width * imageInfo.height,
        compressedSize: compressedInfo.size,
        compressionRatio: (1 - compressedInfo.size / (imageInfo.width * imageInfo.height * 4)).toFixed(2)
      }, 'ImageProcessor');

      return {
        path: compressedPath,
        width,
        height,
        size: compressedInfo.size,
        format
      };
    } catch (error) {
      logger.error('图片压缩失败', { path: filePath, error }, 'ImageProcessor');
      throw error;
    }
  }

  // 计算压缩后的尺寸
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 如果图片尺寸超过最大限制，按比例缩放
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    return { width, height };
  }

  // 压缩图片文件
  compressImageFile(filePath, options) {
    return new Promise((resolve, reject) => {
      const { quality, width, height, format } = options;
      
      wx.compressImage({
        src: filePath,
        quality: Math.round(quality * 100),
        width,
        height,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  // 获取文件信息
  getFileInfo(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileInfo({
        filePath,
        success: (res) => {
          resolve({
            size: res.size,
            digest: res.digest
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  // 批量压缩图片
  async compressImages(filePaths, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < filePaths.length; i++) {
      try {
        const result = await this.compressImage(filePaths[i], options);
        results.push(result);
        
        logger.info(`批量压缩进度: ${i + 1}/${filePaths.length}`, {
          path: filePaths[i],
          success: true
        }, 'ImageProcessor');
      } catch (error) {
        errors.push({
          path: filePaths[i],
          error: error.message
        });
        
        logger.error(`批量压缩失败: ${i + 1}/${filePaths.length}`, {
          path: filePaths[i],
          error
        }, 'ImageProcessor');
      }
    }

    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  // 智能压缩（根据文件大小自动选择质量）
  async smartCompress(filePath, options = {}) {
    try {
      // 获取文件信息
      const fileInfo = await this.getFileInfo(filePath);
      const fileSize = fileInfo.size;

      // 根据文件大小选择压缩质量
      let quality = this.config.defaultQuality;
      if (fileSize < 100 * 1024) {
        quality = this.config.compression.qualityBySize.small;
      } else if (fileSize < 1024 * 1024) {
        quality = this.config.compression.qualityBySize.medium;
      } else {
        quality = this.config.compression.qualityBySize.large;
      }

      // 执行压缩
      return await this.compressImage(filePath, { ...options, quality });
    } catch (error) {
      logger.error('智能压缩失败', { path: filePath, error }, 'ImageProcessor');
      throw error;
    }
  }

  // 检查图片格式是否支持
  isFormatSupported(format) {
    return this.config.supportedFormats.includes(format.toLowerCase());
  }

  // 检查文件大小是否超限
  isFileSizeValid(size) {
    return size <= this.config.maxFileSize;
  }

  // 生成缩略图
  async generateThumbnail(filePath, options = {}) {
    const {
      width = 200,
      height = 200,
      quality = 0.8,
      mode = 'aspectFill'
    } = options;

    try {
      const result = await this.compressImage(filePath, {
        quality,
        width,
        height
      });

      logger.info('缩略图生成成功', {
        originalPath: filePath,
        thumbnailPath: result.path,
        size: result.size
      }, 'ImageProcessor');

      return result;
    } catch (error) {
      logger.error('缩略图生成失败', { path: filePath, error }, 'ImageProcessor');
      throw error;
    }
  }

  // 图片格式转换
  async convertFormat(filePath, targetFormat) {
    if (!this.isFormatSupported(targetFormat)) {
      throw new Error(`不支持的图片格式: ${targetFormat}`);
    }

    try {
      const result = await this.compressImage(filePath, {
        format: targetFormat,
        quality: 0.9 // 转换时使用较高质量
      });

      logger.info('图片格式转换成功', {
        originalPath: filePath,
        targetFormat,
        convertedPath: result.path
      }, 'ImageProcessor');

      return result;
    } catch (error) {
      logger.error('图片格式转换失败', { path: filePath, targetFormat, error }, 'ImageProcessor');
      throw error;
    }
  }

  // 获取图片统计信息
  async getImageStats(filePaths) {
    const stats = {
      totalCount: filePaths.length,
      totalSize: 0,
      averageSize: 0,
      sizeDistribution: {
        small: 0,   // < 100KB
        medium: 0,  // 100KB - 1MB
        large: 0    // > 1MB
      },
      formatDistribution: {}
    };

    for (const path of filePaths) {
      try {
        const fileInfo = await this.getFileInfo(path);
        const imageInfo = await this.getImageInfo(path);
        
        stats.totalSize += fileInfo.size;
        
        // 统计大小分布
        if (fileInfo.size < 100 * 1024) {
          stats.sizeDistribution.small++;
        } else if (fileInfo.size < 1024 * 1024) {
          stats.sizeDistribution.medium++;
        } else {
          stats.sizeDistribution.large++;
        }
        
        // 统计格式分布
        const format = imageInfo.type.toLowerCase();
        stats.formatDistribution[format] = (stats.formatDistribution[format] || 0) + 1;
      } catch (error) {
        logger.error('获取图片统计信息失败', { path, error }, 'ImageProcessor');
      }
    }

    stats.averageSize = stats.totalCount > 0 ? stats.totalSize / stats.totalCount : 0;

    return stats;
  }
}

// 创建图片处理器实例
const imageProcessor = new ImageProcessor();

// 图片处理工具
export const imageUtils = {
  // 压缩图片
  compress: (filePath, options) => imageProcessor.compressImage(filePath, options),
  
  // 智能压缩
  smartCompress: (filePath, options) => imageProcessor.smartCompress(filePath, options),
  
  // 批量压缩
  compressBatch: (filePaths, options) => imageProcessor.compressImages(filePaths, options),
  
  // 生成缩略图
  generateThumbnail: (filePath, options) => imageProcessor.generateThumbnail(filePath, options),
  
  // 格式转换
  convertFormat: (filePath, targetFormat) => imageProcessor.convertFormat(filePath, targetFormat),
  
  // 获取图片信息
  getImageInfo: (filePath) => imageProcessor.getImageInfo(filePath),
  
  // 获取文件信息
  getFileInfo: (filePath) => imageProcessor.getFileInfo(filePath),
  
  // 获取图片统计
  getImageStats: (filePaths) => imageProcessor.getImageStats(filePaths),
  
  // 检查格式支持
  isFormatSupported: (format) => imageProcessor.isFormatSupported(format),
  
  // 检查文件大小
  isFileSizeValid: (size) => imageProcessor.isFileSizeValid(size)
};

// 图片上传工具
export const imageUploader = {
  // 选择并压缩图片
  async selectAndCompress(options = {}) {
    const {
      count = 1,
      sizeType = ['compressed'],
      sourceType = ['album', 'camera'],
      compressOptions = {}
    } = options;

    try {
      // 选择图片
      const selectResult = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count,
          sizeType,
          sourceType,
          success: resolve,
          fail: reject
        });
      });

      // 压缩图片
      const compressedResults = await imageProcessor.compressImages(
        selectResult.tempFilePaths,
        compressOptions
      );

      return {
        originalFiles: selectResult.tempFilePaths,
        compressedFiles: compressedResults.results,
        errors: compressedResults.errors
      };
    } catch (error) {
      logger.error('选择并压缩图片失败', error, 'ImageUploader');
      throw error;
    }
  },

  // 上传图片到服务器
  async uploadImage(filePath, uploadUrl, options = {}) {
    const {
      name = 'file',
      formData = {},
      header = {}
    } = options;

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: uploadUrl,
          filePath,
          name,
          formData,
          header,
          success: resolve,
          fail: reject
        });
      });

      logger.info('图片上传成功', {
        path: filePath,
        response: uploadResult.data
      }, 'ImageUploader');

      return uploadResult;
    } catch (error) {
      logger.error('图片上传失败', { path: filePath, error }, 'ImageUploader');
      throw error;
    }
  },

  // 批量上传图片
  async uploadImages(filePaths, uploadUrl, options = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < filePaths.length; i++) {
      try {
        const result = await this.uploadImage(filePaths[i], uploadUrl, options);
        results.push(result);
        
        logger.info(`批量上传进度: ${i + 1}/${filePaths.length}`, {
          path: filePaths[i],
          success: true
        }, 'ImageUploader');
      } catch (error) {
        errors.push({
          path: filePaths[i],
          error: error.message
        });
        
        logger.error(`批量上传失败: ${i + 1}/${filePaths.length}`, {
          path: filePaths[i],
          error
        }, 'ImageUploader');
      }
    }

    return {
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    };
  }
};

// 默认导出
export default imageUtils; 