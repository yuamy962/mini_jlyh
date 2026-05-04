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
    // 集合不存在时静默失败，不影响用户体验
    if (error.errCode === -502005 || error.message.includes('Collection not found')) {
      console.warn('events 集合不存在，埋点数据未写入');
      return { success: true, warning: '集合未创建' };
    }
    console.error('埋点失败:', error);
    return { success: false, message: error.message };
  }
};
