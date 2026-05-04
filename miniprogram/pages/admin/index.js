// pages/admin/index.js
Page({
  data: {
    stats: {
      totalUsers: 0,
      clickedPayUsers: 0,
      bookedUsers: 0,
      modalShows: 0,
      unlockClicks: 0,
      bookClicks: 0,
      submitCount: 0,
      unlockToBookRate: '0.00',
      modalToBookRate: '0.00'
    },
    normalUsers: 0,
    clickedOnlyUsers: 0,
    normalRate: 0,
    clickedRate: 0,
    bookedRate: 0,
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadData() {
    this.setData({ loading: true });
    return wx.cloud.callFunction({
      name: 'getDashboard'
    }).then(res => {
      const result = res.result;
      if (result && result.success) {
        const stats = result.data;
        const normalUsers = stats.totalUsers - stats.clickedPayUsers;
        const clickedOnlyUsers = stats.clickedPayUsers - stats.bookedUsers;
        const total = stats.totalUsers || 1;

        this.setData({
          stats,
          normalUsers,
          clickedOnlyUsers,
          normalRate: ((normalUsers / total) * 100).toFixed(1),
          clickedRate: ((clickedOnlyUsers / total) * 100).toFixed(1),
          bookedRate: ((stats.bookedUsers / total) * 100).toFixed(1)
        });
      } else {
        wx.showToast({ title: '获取数据失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('获取面板数据失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
});
