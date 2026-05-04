const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 安全的查询封装：集合不存在时返回默认值
async function safeGet(collection, query, defaultValue) {
  try {
    return await db.collection(collection).where(query).get();
  } catch (e) {
    if (e.errCode === -502005 || e.message.includes('Collection not found')) {
      return defaultValue;
    }
    throw e;
  }
}

async function safeCount(collection, defaultValue) {
  try {
    return await db.collection(collection).count();
  } catch (e) {
    if (e.errCode === -502005 || e.message.includes('Collection not found')) {
      return defaultValue;
    }
    throw e;
  }
}

exports.main = async (event, context) => {
  const { action, source } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { success: false, message: '未获取到用户信息' };
  }

  try {
    if (action === 'stats') {
      const countRes = await safeCount('reservations', { total: 0 });
      return {
        success: true,
        totalCount: countRes.total || 0
      };
    }

    if (action === 'book') {
      const checkRes = await safeGet('reservations', { _openid: openid }, { data: [] });
      
      if (checkRes.data && checkRes.data.length > 0) {
        const countRes = await safeCount('reservations', { total: 0 });
        return {
          success: true,
          isNew: false,
          message: '您已预约过',
          totalCount: countRes.total || 0
        };
      }

      // 创建预约记录（add 会自动创建集合）
      await db.collection('reservations').add({
        data: {
          source: source || 'unknown',
          createTime: db.serverDate()
        }
      });

      const countRes = await safeCount('reservations', { total: 0 });
      return {
        success: true,
        isNew: true,
        message: '预约成功',
        totalCount: countRes.total || 0
      };
    }

    return { success: false, message: '未知的 action 类型' };

  } catch (error) {
    console.error('预约云函数错误:', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};
