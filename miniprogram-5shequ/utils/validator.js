/**
 * 表单验证工具
 * 支持多种验证规则、自定义验证器和异步验证
 */

import { logger } from './logger';

// 验证规则类型
export const VALIDATION_TYPES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  RANGE: 'range',
  CUSTOM: 'custom',
  ASYNC: 'async'
};

// 内置验证规则
const BUILTIN_RULES = {
  // 必填验证
  [VALIDATION_TYPES.REQUIRED]: {
    validate: (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message: '此字段为必填项'
  },

  // 邮箱验证
  [VALIDATION_TYPES.EMAIL]: {
    validate: (value) => {
      if (!value) return true; // 空值跳过验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: '请输入有效的邮箱地址'
  },

  // 手机号验证
  [VALIDATION_TYPES.PHONE]: {
    validate: (value) => {
      if (!value) return true;
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(value);
    },
    message: '请输入有效的手机号码'
  },

  // 最小长度验证
  [VALIDATION_TYPES.MIN_LENGTH]: {
    validate: (value, minLength) => {
      if (!value) return true;
      return String(value).length >= minLength;
    },
    message: (minLength) => `最少需要${minLength}个字符`
  },

  // 最大长度验证
  [VALIDATION_TYPES.MAX_LENGTH]: {
    validate: (value, maxLength) => {
      if (!value) return true;
      return String(value).length <= maxLength;
    },
    message: (maxLength) => `最多允许${maxLength}个字符`
  },

  // 正则表达式验证
  [VALIDATION_TYPES.PATTERN]: {
    validate: (value, pattern) => {
      if (!value) return true;
      const regex = new RegExp(pattern);
      return regex.test(value);
    },
    message: '格式不正确'
  },

  // 范围验证
  [VALIDATION_TYPES.RANGE]: {
    validate: (value, { min, max }) => {
      if (!value) return true;
      const num = Number(value);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    },
    message: ({ min, max }) => {
      if (min !== undefined && max !== undefined) {
        return `数值必须在${min}到${max}之间`;
      } else if (min !== undefined) {
        return `数值不能小于${min}`;
      } else if (max !== undefined) {
        return `数值不能大于${max}`;
      }
      return '数值格式不正确';
    }
  }
};

// 验证器类
class Validator {
  constructor(options = {}) {
    this.rules = { ...BUILTIN_RULES, ...options.customRules };
    this.messages = { ...options.messages };
    this.asyncValidators = new Map();
  }

  // 添加自定义验证规则
  addRule(type, rule) {
    this.rules[type] = rule;
  }

  // 添加异步验证器
  addAsyncValidator(name, validator) {
    this.asyncValidators.set(name, validator);
  }

  // 验证单个字段
  validateField(value, rules) {
    const errors = [];

    for (const rule of rules) {
      const { type, params, message, customValidator } = rule;

      try {
        let isValid = false;

        if (type === VALIDATION_TYPES.CUSTOM && customValidator) {
          // 自定义验证器
          isValid = customValidator(value, params);
        } else if (type === VALIDATION_TYPES.ASYNC) {
          // 异步验证器（返回Promise）
          continue; // 异步验证器单独处理
        } else if (this.rules[type]) {
          // 内置验证规则
          isValid = this.rules[type].validate(value, params);
        }

        if (!isValid) {
          const errorMessage = this.getMessage(rule, value, params);
          errors.push({
            type,
            message: errorMessage,
            value,
            params
          });
        }
      } catch (error) {
        logger.error('验证规则执行失败', { type, error }, 'Validator');
        errors.push({
          type,
          message: '验证规则执行失败',
          value,
          params
        });
      }
    }

    return errors;
  }

  // 异步验证单个字段
  async validateFieldAsync(value, rules) {
    const errors = [];
    const asyncRules = rules.filter(rule => rule.type === VALIDATION_TYPES.ASYNC);

    for (const rule of asyncRules) {
      const { name, params, message } = rule;

      try {
        const asyncValidator = this.asyncValidators.get(name);
        if (asyncValidator) {
          const isValid = await asyncValidator(value, params);
          if (!isValid) {
            const errorMessage = this.getMessage(rule, value, params);
            errors.push({
              type: VALIDATION_TYPES.ASYNC,
              name,
              message: errorMessage,
              value,
              params
            });
          }
        }
      } catch (error) {
        logger.error('异步验证器执行失败', { name, error }, 'Validator');
        errors.push({
          type: VALIDATION_TYPES.ASYNC,
          name,
          message: '异步验证失败',
          value,
          params
        });
      }
    }

    return errors;
  }

  // 验证表单
  validateForm(formData, schema) {
    const errors = {};
    const asyncValidations = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = formData[field];
      const fieldErrors = this.validateField(value, rules);

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }

      // 收集异步验证
      const asyncRules = rules.filter(rule => rule.type === VALIDATION_TYPES.ASYNC);
      if (asyncRules.length > 0) {
        asyncValidations.push({
          field,
          value,
          rules: asyncRules
        });
      }
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
      asyncValidations
    };
  }

  // 异步验证表单
  async validateFormAsync(formData, schema) {
    const result = this.validateForm(formData, schema);
    const asyncErrors = {};

    // 执行异步验证
    for (const { field, value, rules } of result.asyncValidations) {
      const fieldErrors = await this.validateFieldAsync(value, rules);
      if (fieldErrors.length > 0) {
        asyncErrors[field] = fieldErrors;
      }
    }

    // 合并同步和异步错误
    const allErrors = { ...result.errors, ...asyncErrors };

    return {
      errors: allErrors,
      isValid: Object.keys(allErrors).length === 0
    };
  }

  // 获取错误消息
  getMessage(rule, value, params) {
    const { type, message } = rule;

    // 优先使用规则中的自定义消息
    if (message) {
      return typeof message === 'function' ? message(value, params) : message;
    }

    // 使用全局消息配置
    if (this.messages[type]) {
      const globalMessage = this.messages[type];
      return typeof globalMessage === 'function' ? globalMessage(value, params) : globalMessage;
    }

    // 使用内置规则消息
    if (this.rules[type] && this.rules[type].message) {
      const builtinMessage = this.rules[type].message;
      return typeof builtinMessage === 'function' ? builtinMessage(params) : builtinMessage;
    }

    return '验证失败';
  }

  // 创建验证规则
  createRule(type, params = null, message = null) {
    return { type, params, message };
  }

  // 创建自定义验证规则
  createCustomRule(validator, message = null) {
    return { type: VALIDATION_TYPES.CUSTOM, customValidator: validator, message };
  }

  // 创建异步验证规则
  createAsyncRule(name, message = null) {
    return { type: VALIDATION_TYPES.ASYNC, name, message };
  }
}

// 创建验证器实例
const validator = new Validator({
  messages: {
    [VALIDATION_TYPES.REQUIRED]: '此字段为必填项',
    [VALIDATION_TYPES.EMAIL]: '请输入有效的邮箱地址',
    [VALIDATION_TYPES.PHONE]: '请输入有效的手机号码',
    [VALIDATION_TYPES.MIN_LENGTH]: (minLength) => `最少需要${minLength}个字符`,
    [VALIDATION_TYPES.MAX_LENGTH]: (maxLength) => `最多允许${maxLength}个字符`,
    [VALIDATION_TYPES.PATTERN]: '格式不正确',
    [VALIDATION_TYPES.RANGE]: ({ min, max }) => {
      if (min !== undefined && max !== undefined) {
        return `数值必须在${min}到${max}之间`;
      } else if (min !== undefined) {
        return `数值不能小于${min}`;
      } else if (max !== undefined) {
        return `数值不能大于${max}`;
      }
      return '数值格式不正确';
    }
  }
});

// 添加常用异步验证器
validator.addAsyncValidator('checkUsername', async (value) => {
  // 模拟检查用户名是否已存在
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value !== 'admin'); // 用户名不能是admin
    }, 1000);
  });
});

validator.addAsyncValidator('checkEmail', async (value) => {
  // 模拟检查邮箱是否已注册
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value !== 'test@example.com'); // 邮箱不能是test@example.com
    }, 1000);
  });
});

// 表单验证工具
export const formValidator = {
  // 验证单个字段
  validateField: (value, rules) => validator.validateField(value, rules),
  
  // 异步验证单个字段
  validateFieldAsync: (value, rules) => validator.validateFieldAsync(value, rules),
  
  // 验证表单
  validateForm: (formData, schema) => validator.validateForm(formData, schema),
  
  // 异步验证表单
  validateFormAsync: (formData, schema) => validator.validateFormAsync(formData, schema),
  
  // 创建验证规则
  createRule: (type, params, message) => validator.createRule(type, params, message),
  
  // 创建自定义验证规则
  createCustomRule: (validator, message) => validator.createCustomRule(validator, message),
  
  // 创建异步验证规则
  createAsyncRule: (name, message) => validator.createAsyncRule(name, message),
  
  // 添加自定义验证规则
  addRule: (type, rule) => validator.addRule(type, rule),
  
  // 添加异步验证器
  addAsyncValidator: (name, validator) => validator.addAsyncValidator(name, validator)
};

// 常用验证规则
export const commonRules = {
  // 必填
  required: (message) => formValidator.createRule(VALIDATION_TYPES.REQUIRED, null, message),
  
  // 邮箱
  email: (message) => formValidator.createRule(VALIDATION_TYPES.EMAIL, null, message),
  
  // 手机号
  phone: (message) => formValidator.createRule(VALIDATION_TYPES.PHONE, null, message),
  
  // 最小长度
  minLength: (length, message) => formValidator.createRule(VALIDATION_TYPES.MIN_LENGTH, length, message),
  
  // 最大长度
  maxLength: (length, message) => formValidator.createRule(VALIDATION_TYPES.MAX_LENGTH, length, message),
  
  // 正则表达式
  pattern: (regex, message) => formValidator.createRule(VALIDATION_TYPES.PATTERN, regex, message),
  
  // 数值范围
  range: (min, max, message) => formValidator.createRule(VALIDATION_TYPES.RANGE, { min, max }, message),
  
  // 用户名检查
  checkUsername: (message) => formValidator.createAsyncRule('checkUsername', message),
  
  // 邮箱检查
  checkEmail: (message) => formValidator.createAsyncRule('checkEmail', message)
};

// 表单验证组件混入
export const formMixin = {
  data: {
    formErrors: {},
    isSubmitting: false
  },

  methods: {
    // 验证单个字段
    validateField(field, value, rules) {
      const errors = formValidator.validateField(value, rules);
      this.setData({
        [`formErrors.${field}`]: errors
      });
      return errors.length === 0;
    },

    // 异步验证单个字段
    async validateFieldAsync(field, value, rules) {
      const errors = await formValidator.validateFieldAsync(value, rules);
      this.setData({
        [`formErrors.${field}`]: errors
      });
      return errors.length === 0;
    },

    // 验证表单
    validateForm(formData, schema) {
      const result = formValidator.validateForm(formData, schema);
      this.setData({
        formErrors: result.errors
      });
      return result.isValid;
    },

    // 异步验证表单
    async validateFormAsync(formData, schema) {
      const result = await formValidator.validateFormAsync(formData, schema);
      this.setData({
        formErrors: result.errors
      });
      return result.isValid;
    },

    // 清除字段错误
    clearFieldError(field) {
      this.setData({
        [`formErrors.${field}`]: []
      });
    },

    // 清除所有错误
    clearAllErrors() {
      this.setData({
        formErrors: {}
      });
    },

    // 获取字段错误消息
    getFieldError(field) {
      const errors = this.data.formErrors[field];
      return errors && errors.length > 0 ? errors[0].message : '';
    },

    // 检查字段是否有错误
    hasFieldError(field) {
      const errors = this.data.formErrors[field];
      return errors && errors.length > 0;
    },

    // 检查表单是否有错误
    hasFormErrors() {
      return Object.keys(this.data.formErrors).length > 0;
    }
  }
};

// 默认导出
export default formValidator; 