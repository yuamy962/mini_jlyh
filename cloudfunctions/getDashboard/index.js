const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 1. 总用户数
    const usersCountRes = await db.collection('users').count();
    const totalUsers = usersCountRes.total || 0;

    // 2. 点击过付费用户数
    const clickedPayRes = await db.collection('users').where({
      tag: _.in(['clicked_pay', 'booked'])
    }).count();
    const clickedPayUsers = clickedPayRes.total || 0;

    // 3. 已预约用户数
    const bookedRes = await db.collection('users').where({
      tag: 'booked'
    }).count();
    const bookedUsers = bookedRes.total || 0;

    // 4. 弹窗展示次数
    const modalShowRes = await db.collection('events').where({
      eventType: 'show_modal'
    }).count();
    const modalShows = modalShowRes.total || 0;

    // 5. 解锁点击次数
    const unlockClickRes = await db.collection('events').where({
      eventType: 'click_unlock'
    }).count();
    const unlockClicks = unlockClickRes.total || 0;

    // 6. 预约点击次数
    const bookClickRes = await db.collection('events').where({
      eventType: 'click_book'
    }).count();
    const bookClicks = bookClickRes.total || 0;

    // 7. 提交简历次数
    const submitRes = await db.collection('events').where({
      eventType: 'submit_resume'
    }).count();
    const submitCount = submitRes.total || 0;

    // 转化率计算
    const unlockToBookRate = unlockClicks > 0 ? ((bookClicks / unlockClicks) * 100).toFixed(2) : 0;
    const modalToBookRate = modalShows > 0 ? ((bookClicks / modalShows) * 100).toFixed(2) : 0;

    return {
      success: true,
      data: {
        totalUsers,
        clickedPayUsers,
        bookedUsers,
        modalShows,
        unlockClicks,
        bookClicks,
        submitCount,
        unlockToBookRate,
        modalToBookRate
      }
    };
  } catch (error) {
    console.error('统计面板错误:', error);
    return { success: false, message: error.message };
  }
};
