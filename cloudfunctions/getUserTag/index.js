const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, tag, usageCount } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { success: false, message: '未获取到用户信息' };
  }

  try {
    const userRes = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (action === 'get') {
      if (userRes.data && userRes.data.length > 0) {
        const user = userRes.data[0];
        await db.collection('users').doc(user._id).update({
          data: { lastVisitTime: db.serverDate() }
        });
        return { success: true, data: user };
      } else {
        const newUser = {
          tag: 'normal',
          usageCount: 0,
          firstVisitTime: db.serverDate(),
          lastVisitTime: db.serverDate()
        };
        const addRes = await db.collection('users').add({ data: newUser });
        return { success: true, data: { ...newUser, _id: addRes._id } };
      }
    }

    if (action === 'update') {
      const updateData = { lastVisitTime: db.serverDate() };
      if (tag) updateData.tag = tag;
      if (typeof usageCount === 'number') updateData.usageCount = usageCount;

      if (userRes.data && userRes.data.length > 0) {
        const user = userRes.data[0];
        await db.collection('users').doc(user._id).update({ data: updateData });
        return { success: true, data: { ...user, ...updateData } };
      } else {
        const newUser = {
          tag: tag || 'normal',
          usageCount: usageCount || 0,
          firstVisitTime: db.serverDate(),
          lastVisitTime: db.serverDate(),
          ...updateData
        };
        const addRes = await db.collection('users').add({ data: newUser });
        return { success: true, data: { ...newUser, _id: addRes._id } };
      }
    }

    return { success: false, message: '未知的 action 类型' };
  } catch (error) {
    console.error('用户标签云函数错误:', error);
    return { success: false, message: error.message };
  }
};
