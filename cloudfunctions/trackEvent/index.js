const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { eventType, page, extraData } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { success: false, message: '未获取到用户信息' };
  }

  try {
    await db.collection('events').add({
      data: {
        eventType: eventType || 'unknown',
        page: page || 'unknown',
        extraData: extraData || {},
        createTime: db.serverDate()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('埋点失败:', error);
    return { success: false, message: error.message };
  }
};
