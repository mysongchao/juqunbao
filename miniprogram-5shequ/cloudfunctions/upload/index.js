/**
 * @file cloudfunctions/upload/index.js
 * @description 文件上传相关云函数，处理图片/文件上传、删除、信息获取等
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - uploadImage: 上传图片
 * - uploadFile: 上传文件
 * - deleteFile: 删除文件
 * - getFileInfo: 获取文件信息
 * - batchUpload: 批量上传
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'upload', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  /**
   * 云函数主入口
   * @param {Object} event - 事件参数，包含 type、文件参数等
   * @param {Object} context - 云函数上下文
   * @returns {Object} 返回结果，结构为 { code, msg, data }
   */
  const { OPENID } = cloud.getWXContext();
  
  console.log('=== upload 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('OPENID:', OPENID);
  
  switch(event.type) {
    case 'uploadImage': {
      /**
       * 上传图片
       * @param {string} fileID - 临时文件ID
       * @param {string} fileName - 文件名
       * @returns {Object} { fileID, fileName }
       */
      console.log('=== uploadImage 开始处理 ===');
      const { fileID, fileName } = event;
      
      if (!fileID) {
        console.log('❌ 缺少文件ID');
        return { code: -1, msg: '缺少文件ID' };
      }
      
      try {
        // 获取文件信息
        const fileInfo = await cloud.getTempFileURL({
          fileList: [fileID]
        });
        
        if (!fileInfo.fileList || fileInfo.fileList.length === 0) {
          console.log('❌ 获取文件信息失败');
          return { code: -1, msg: '获取文件信息失败' };
        }
        
        const file = fileInfo.fileList[0];
        if (file.status !== 0) {
          console.log('❌ 文件不存在或已过期');
          return { code: -1, msg: '文件不存在或已过期' };
        }
        
        // 生成新的文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = fileName ? fileName.split('.').pop() : 'jpg';
        const newFileName = `images/${OPENID}/${timestamp}_${randomStr}.${extension}`;
        
        // 下载并重新上传到云存储
        const downloadResult = await cloud.downloadFile({
          fileID: fileID
        });
        
        const uploadResult = await cloud.uploadFile({
          cloudPath: newFileName,
          fileContent: downloadResult.fileContent
        });
        
        console.log('✅ 图片上传成功:', uploadResult.fileID);
        
        return { 
          code: 0, 
          msg: 'success', 
          data: { 
            fileID: uploadResult.fileID,
            fileName: newFileName
          }
        };
      } catch (error) {
        console.error('❌ 图片上传失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '图片上传失败', error: error.message };
      }
    }
    
    case 'uploadFile': {
      /**
       * 上传文件
       * @param {string} fileID - 临时文件ID
       * @param {string} fileName - 文件名
       * @param {string} fileType - 文件类型
       * @returns {Object} { fileID, fileName, fileType }
       */
      console.log('=== uploadFile 开始处理 ===');
      const { fileID, fileName, fileType = 'other' } = event;
      
      if (!fileID) {
        console.log('❌ 缺少文件ID');
        return { code: -1, msg: '缺少文件ID' };
      }
      
      try {
        // 获取文件信息
        const fileInfo = await cloud.getTempFileURL({
          fileList: [fileID]
        });
        
        if (!fileInfo.fileList || fileInfo.fileList.length === 0) {
          console.log('❌ 获取文件信息失败');
          return { code: -1, msg: '获取文件信息失败' };
        }
        
        const file = fileInfo.fileList[0];
        if (file.status !== 0) {
          console.log('❌ 文件不存在或已过期');
          return { code: -1, msg: '文件不存在或已过期' };
        }
        
        // 生成新的文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = fileName ? fileName.split('.').pop() : 'file';
        const newFileName = `files/${fileType}/${OPENID}/${timestamp}_${randomStr}.${extension}`;
        
        // 下载并重新上传到云存储
        const downloadResult = await cloud.downloadFile({
          fileID: fileID
        });
        
        const uploadResult = await cloud.uploadFile({
          cloudPath: newFileName,
          fileContent: downloadResult.fileContent
        });
        
        console.log('✅ 文件上传成功:', uploadResult.fileID);
        
        return { 
          code: 0, 
          msg: 'success', 
          data: { 
            fileID: uploadResult.fileID,
            fileName: newFileName,
            fileType: fileType
          }
        };
      } catch (error) {
        console.error('❌ 文件上传失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '文件上传失败', error: error.message };
      }
    }
    
    case 'deleteFile': {
      /**
       * 删除文件
       * @param {string} fileID - 文件ID
       * @returns {Object} 操作结果
       */
      console.log('=== deleteFile 开始处理 ===');
      const { fileID } = event;
      
      if (!fileID) {
        console.log('❌ 缺少文件ID');
        return { code: -1, msg: '缺少文件ID' };
      }
      
      try {
        await cloud.deleteFile({
          fileList: [fileID]
        });
        
        console.log('✅ 文件删除成功');
        return { code: 0, msg: 'success' };
      } catch (error) {
        console.error('❌ 文件删除失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '文件删除失败', error: error.message };
      }
    }
    
    case 'getFileInfo': {
      /**
       * 获取文件信息
       * @param {string} fileID - 文件ID
       * @returns {Object} 文件信息
       */
      console.log('=== getFileInfo 开始处理 ===');
      const { fileID } = event;
      
      if (!fileID) {
        console.log('❌ 缺少文件ID');
        return { code: -1, msg: '缺少文件ID' };
      }
      
      try {
        const fileInfo = await cloud.getTempFileURL({
          fileList: [fileID]
        });
        
        if (!fileInfo.fileList || fileInfo.fileList.length === 0) {
          console.log('❌ 获取文件信息失败');
          return { code: -1, msg: '获取文件信息失败' };
        }
        
        const file = fileInfo.fileList[0];
        console.log('✅ 文件信息获取成功');
        
        return { 
          code: 0, 
          msg: 'success', 
          data: {
            fileID: file.fileID,
            tempFileURL: file.tempFileURL,
            status: file.status,
            errMsg: file.errMsg
          }
        };
      } catch (error) {
        console.error('❌ 获取文件信息失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '获取文件信息失败', error: error.message };
      }
    }
    
    case 'batchUpload': {
      /**
       * 批量上传文件
       * @param {Array} fileList - 文件列表
       * @returns {Object} 操作结果
       */
      console.log('=== batchUpload 开始处理 ===');
      const { fileList } = event;
      
      if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
        console.log('❌ 缺少文件列表');
        return { code: -1, msg: '缺少文件列表' };
      }
      
      try {
        const uploadPromises = fileList.map(async (file, index) => {
          try {
            const result = await cloud.downloadFile({
              fileID: file.fileID
            });
            
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const extension = file.fileName ? file.fileName.split('.').pop() : 'jpg';
            const newFileName = `images/${OPENID}/${timestamp}_${randomStr}_${index}.${extension}`;
            
            const uploadResult = await cloud.uploadFile({
              cloudPath: newFileName,
              fileContent: result.fileContent
            });
            
            return {
              success: true,
              originalFileID: file.fileID,
              newFileID: uploadResult.fileID,
              fileName: newFileName
            };
          } catch (error) {
            console.error(`❌ 文件 ${file.fileID} 上传失败:`, error);
            console.error('堆栈:', error.stack);
            return {
              success: false,
              originalFileID: file.fileID,
              error: error.message
            };
          }
        });
        
        const results = await Promise.all(uploadPromises);
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        console.log(`✅ 批量上传完成，成功: ${successCount}, 失败: ${failCount}`);
        
        return { 
          code: 0, 
          msg: 'success', 
          data: {
            results: results,
            successCount: successCount,
            failCount: failCount
          }
        };
      } catch (error) {
        console.error('❌ 批量上传失败:', error);
        console.error('堆栈:', error.stack);
        return { code: -1, msg: '批量上传失败', error: error.message };
      }
    }
    
    default:
      console.log('❌ 未知的 type:', event.type);
      console.log('未知 type 事件详情:', JSON.stringify(event, null, 2));
      return { code: -1, msg: 'unknown type' };
  }
}; 