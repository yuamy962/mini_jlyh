// pages/result/index.js
Page({
  data: {
    result: null,
    showBookingModal: false,
    showSuccessModal: false,
    bookingCount: 1023,
    isBooked: false,
    problemsPreview: [],
    problemsHidden: []
  },

  onLoad() {
    const app = getApp();
    const result = app.globalData.optimizeResult;
    
    if (!result) {
      wx.showToast({ title: '暂无优化结果', icon: 'none' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
      return;
    }

    // 分离问题列表：展示前2条，隐藏剩余
    const problems = result.problems || [];
    const problemsPreview = problems.slice(0, 2);
    const problemsHidden = problems.slice(2);

    // 检查是否已预约
    const isBooked = wx.getStorageSync('has_booked') || false;

    this.setData({ 
      result, 
      problemsPreview, 
      problemsHidden,
      isBooked 
    });

    // 获取预约统计
    this.fetchBookingStats();
  },

  onShow() {
    // 每次显示时刷新预约状态
    const isBooked = wx.getStorageSync('has_booked') || false;
    if (isBooked !== this.data.isBooked) {
      this.setData({ isBooked });
    }
  },

  fetchBookingStats() {
    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'stats' }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({
          bookingCount: res.result.totalCount || 1023
        });
      }
    }).catch(err => {
      console.error('获取统计失败', err);
    });
  },

  onUnlockResume() {
    this.setData({ showBookingModal: true });
  },

  onMoreProblems() {
    this.setData({ showBookingModal: true });
  },

  onCloseBookingModal() {
    this.setData({ showBookingModal: false });
  },

  onBooking() {
    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'book', source: 'result' }
    }).then(res => {
      const result = res.result;
      if (result && result.success) {
        wx.setStorageSync('has_booked', true);
        this.setData({ 
          showBookingModal: false,
          showSuccessModal: true,
          isBooked: true,
          bookingCount: result.totalCount || this.data.bookingCount + 1
        });
      } else {
        wx.showToast({ title: result.message || '预约失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('预约失败', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  },

  onCloseSuccessModal() {
    this.setData({ showSuccessModal: false });
  }
});
