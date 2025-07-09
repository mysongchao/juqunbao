/**
 * 云函数统一响应处理工具
 */

// 响应状态码
export const RESPONSE_CODES = {
  SUCCESS: 0,
  ERROR: -1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500
};

// 响应消息
export const RESPONSE_MESSAGES = {
  SUCCESS: 'success',
  ERROR: '操作失败',
  UNAUTHORIZED: '未授权',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '参数错误',
  SERVER_ERROR: '服务器错误'
};

// 创建成功响应
export const createSuccessResponse = (data = null, message = RESPONSE_MESSAGES.SUCCESS) => {
  return {
    code: RESPONSE_CODES.SUCCESS,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// 创建错误响应
export const createErrorResponse = (code = RESPONSE_CODES.ERROR, message = RESPONSE_MESSAGES.ERROR, data = null) => {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// 参数验证
export const validateParams = (params, requiredFields = []) => {
  const missingFields = requiredFields.filter(field => {
    const value = params[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new Error(`缺少必填参数: ${missingFields.join(', ')}`);
  }

  return true;
};

// 权限检查
export const checkPermission = (userOpenId, requiredOpenId) => {
  if (!userOpenId) {
    throw new Error('用户未登录');
  }

  if (requiredOpenId && userOpenId !== requiredOpenId) {
    throw new Error('权限不足');
  }

  return true;
};

// 分页处理
export const handlePagination = (query, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;
  return query.skip(skip).limit(pageSize);
};

// 统一错误处理
export const handleError = (error, context = '') => {
  console.error(`[${context}] 错误:`, error);

  // 如果是已知错误，直接返回
  if (error.message && error.message.includes('缺少必填参数')) {
    return createErrorResponse(RESPONSE_CODES.VALIDATION_ERROR, error.message);
  }

  if (error.message && error.message.includes('权限不足')) {
    return createErrorResponse(RESPONSE_CODES.FORBIDDEN, error.message);
  }

  if (error.message && error.message.includes('用户未登录')) {
    return createErrorResponse(RESPONSE_CODES.UNAUTHORIZED, error.message);
  }

  // 默认服务器错误
  return createErrorResponse(RESPONSE_CODES.SERVER_ERROR, error.message || RESPONSE_MESSAGES.SERVER_ERROR);
};

// 响应包装器
export const responseWrapper = (handler) => {
  return async (event, context) => {
    try {
      const result = await handler(event, context);
      
      // 如果返回的是标准响应格式，直接返回
      if (result && typeof result === 'object' && 'code' in result) {
        return result;
      }
      
      // 否则包装为成功响应
      return createSuccessResponse(result);
    } catch (error) {
      return handleError(error, handler.name);
    }
  };
};

// 数据库操作包装器
export const dbOperationWrapper = (operation) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw new Error('数据库操作失败');
    }
  };
};

// 导出默认配置
export default {
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
  createSuccessResponse,
  createErrorResponse,
  validateParams,
  checkPermission,
  handlePagination,
  handleError,
  responseWrapper,
  dbOperationWrapper
}; 