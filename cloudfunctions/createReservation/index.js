const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { action, source } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { success: false, message: '未获取到用户信息' };
  }

  try {
    if (action === 'stats') {
      // 查询总预约数
      const countRes = await db.collection('reservations').count();
      return {
        success: true,
        totalCount: countRes.total || 0
      };
    }

    if (action === 'book') {
      // 检查是否已预约
      const checkRes = await db.collection('reservations')
        .where({ _openid: openid })
        .get();
      
      if (checkRes.data && checkRes.data.length > 0) {
        // 已预约，返回现有记录
        const countRes = await db.collection('reservations').count();
        return {
          success: true,
          isNew: false,
          message: '您已预约过',
          totalCount: countRes.total || 0
        };
      }

      // 创建预约记录
      await db.collection('reservations').add({
        data: {
          source: source || 'unknown',
          createTime: db.serverDate()
        }
      });

      const countRes = await db.collection('reservations').count();
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
