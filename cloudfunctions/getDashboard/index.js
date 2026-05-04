const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 安全的 count 封装
async function safeCount(collection, query) {
  try {
    return await db.collection(collection).where(query).count();
  } catch (e) {
    if (e.errCode === -502005 || e.message.includes('Collection not found')) {
      return { total: 0 };
    }
    throw e;
  }
}

exports.main = async (event, context) => {
  try {
    const usersCountRes = await safeCount('users', {});
    const totalUsers = usersCountRes.total || 0;

    const clickedPayRes = await safeCount('users', {
      tag: _.in(['clicked_pay', 'booked'])
    });
    const clickedPayUsers = clickedPayRes.total || 0;

    const bookedRes = await safeCount('users', { tag: 'booked' });
    const bookedUsers = bookedRes.total || 0;

    const modalShowRes = await safeCount('events', { eventType: 'show_modal' });
    const modalShows = modalShowRes.total || 0;

    const unlockClickRes = await safeCount('events', { eventType: 'click_unlock' });
    const unlockClicks = unlockClickRes.total || 0;

    const bookClickRes = await safeCount('events', { eventType: 'click_book' });
    const bookClicks = bookClickRes.total || 0;

    const submitRes = await safeCount('events', { eventType: 'submit_resume' });
    const submitCount = submitRes.total || 0;

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
