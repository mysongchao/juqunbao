/**
 * @file cloudfunctions/home/index.js
 * @description 首页相关云函数，处理内容流、轮播图等接口
 * @author 自动注释
 * @since 2024-06-01
 *
 * 主要功能：
 * - getCards: 获取内容流（推荐/关注流）
 * - getSwipers: 获取首页轮播图
 * - insertSwipers: 插入默认轮播图数据
 *
 * 调用关系：前端通过 wx.cloud.callFunction({ name: 'home', data: { type: ... } }) 调用
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 导入统一响应处理工具
const { 
  createSuccessResponse, 
  createErrorResponse, 
  validateParams, 
  handleError,
  responseWrapper,
  handlePagination
} = require('../common/response.js')

// 获取内容卡片列表
const getCards = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { flowType = 'recommend', page = 1, pageSize = 20 } = event;
  
  console.log('=== getCards 开始处理 ===');
  console.log('参数:', { flowType, page, pageSize, openid: OPENID });
  
  try {
    // 参数验证
    validateParams(event, ['flowType']);
    
    let query = db.collection('content_cards').where({ status: 'published' });
    
    // 关注流：只查关注作者内容
    if (flowType === 'follow' && OPENID) {
      console.log('关注流模式，查找用户关注的作者');
      
      // 查找当前用户关注的作者ID
      const followRes = await db.collection('user_follow')
        .where({ userId: OPENID })
        .get();
      
      const followIds = followRes.data.map(f => f.followId);
      console.log('关注的作者ID列表:', followIds);
      
      if (followIds.length > 0) {
        query = query.where({ authorId: db.command.in(followIds) });
      } else {
        // 如果没有关注任何人，返回空列表
        return createSuccessResponse({
          list: [],
          total: 0,
          page,
          pageSize
        });
      }
    }
    
    // 获取总数
    const totalRes = await query.count();
    const total = totalRes.total;
    
    // 分页查询
    const listRes = await handlePagination(
      query.orderBy('createdAt', 'desc'),
      page,
      pageSize
    ).get();
    
    // 处理数据
    const truncatedList = listRes.data.map(item => ({
      ...item,
      desc: item.desc || ''
    }));
    
    const result = {
      list: truncatedList,
      total,
      page,
      pageSize
    };
    
    console.log('=== getCards 返回结果 ===');
    console.log('数据统计:', {
      listLength: result.list.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    });
    
    return createSuccessResponse(result);
  } catch (error) {
    console.error('getCards 处理失败:', error);
    return handleError(error, 'getCards');
  }
};

// 获取首页轮播图
const getSwipers = async (event, context) => {
  console.log('=== getSwipers 开始处理 ===');
  
  try {
    // 策略1：优先选择有图片且点赞数高的内容
    let swipersRes = await db.collection('content_cards')
      .where({ 
        status: 'published',
        images: db.command.exists(true).and(db.command.neq([]))
      })
      .orderBy('likeCount', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    // 如果策略1结果不足5条，用策略2补充
    if (swipersRes.data.length < 5) {
      console.log('策略1结果不足，使用策略2补充');
      
      const remainingCount = 5 - swipersRes.data.length;
      const existingIds = swipersRes.data.map(item => item._id);
      
      const additionalRes = await db.collection('content_cards')
        .where({ 
          status: 'published',
          images: db.command.exists(true).and(db.command.neq([])),
          _id: db.command.nin(existingIds)
        })
        .orderBy('createdAt', 'desc')
        .limit(remainingCount)
        .get();
      
      // 合并结果
      swipersRes.data = [...swipersRes.data, ...additionalRes.data];
    }
    
    // 转换数据格式为轮播图需要的格式
    const swiperList = swipersRes.data.map((item, index) => ({
      image: item.images && item.images.length > 0 ? item.images[0] : '',
      title: item.desc || '精彩内容',
      link: `/pages/detail/index?id=${item._id}`,
      sort: index + 1,
      contentId: item._id,
      authorId: item.authorId,
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      createdAt: item.createdAt
    }));
    
    console.log('=== getSwipers 返回结果 ===');
    console.log('轮播图数量:', swiperList.length);
    
    return createSuccessResponse(swiperList);
  } catch (error) {
    console.error('getSwipers 处理失败:', error);
    return handleError(error, 'getSwipers');
  }
};

// 插入默认轮播图数据
const insertSwipers = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  
  console.log('=== insertSwipers 开始处理 ===');
  
  try {
    // 检查权限（只有管理员可以执行）
    // 这里可以添加管理员权限检查逻辑
    
    const defaultSwipers = [
      {
        image: '/static/home/card0.png',
        title: '少年,星空与梦想',
        link: '/pages/detail/index?id=default1',
        sort: 1,
        contentId: 'default1',
        authorId: OPENID,
        likeCount: 128,
        commentCount: 32,
        createdAt: new Date()
      },
      {
        image: '/static/home/card1.png',
        title: '仰望星空的少女',
        link: '/pages/detail/index?id=default2',
        sort: 2,
        contentId: 'default2',
        authorId: OPENID,
        likeCount: 256,
        commentCount: 48,
        createdAt: new Date()
      }
    ];
    
    // 插入数据
    const insertPromises = defaultSwipers.map(swiper => 
      db.collection('home_swipers').add({ data: swiper })
    );
    
    const results = await Promise.all(insertPromises);
    
    console.log('=== insertSwipers 返回结果 ===');
    console.log('插入成功数量:', results.length);
    
    return createSuccessResponse({
      insertedCount: results.length,
      swipers: defaultSwipers
    });
  } catch (error) {
    console.error('insertSwipers 处理失败:', error);
    return handleError(error, 'insertSwipers');
  }
};

// 主入口函数
exports.main = responseWrapper(async (event, context) => {
  const { type } = event;
  
  console.log('=== home 云函数调用开始 ===');
  console.log('event:', JSON.stringify(event, null, 2));
  console.log('type:', type);
  
  switch(type) {
    case 'getCards':
      return await getCards(event, context);
    case 'getSwipers':
      return await getSwipers(event, context);
    case 'insertSwipers':
      return await insertSwipers(event, context);
    default:
      return createErrorResponse(-1, `未知的操作类型: ${type}`);
  }
}); 