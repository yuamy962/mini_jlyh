// index.js
Page({
  data: {
    jobTitle: '',
    resumeContent: '',
    contentLength: 0,
    canSubmit: false,
    loading: false,
    showBookingModal: false,
    showSuccessModal: false,
    bookingCount: 1023,
    isBooked: false
  },

  onLoad() {
    // 获取用户标签
    wx.cloud.callFunction({
      name: 'getUserTag',
      data: { action: 'get' }
    }).then(res => {
      if (res.result && res.result.success) {
        const user = res.result.data;
        this.setData({ isBooked: user.tag === 'booked' });
        if (user.usageCount > 0) {
          wx.setStorageSync('resume_usage_count', user.usageCount);
        }
      }
    }).catch(() => {});

    this.fetchBookingStats();
  },

  fetchBookingStats() {
    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'stats' }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ bookingCount: res.result.totalCount || 1023 });
      }
    }).catch(() => {});
  },

  onJobTitleInput(e) {
    this.setData({ jobTitle: e.detail.value });
    this.checkCanSubmit();
  },

  onResumeInput(e) {
    const value = e.detail.value;
    this.setData({ resumeContent: value, contentLength: value.length });
    this.checkCanSubmit();
  },

  checkCanSubmit() {
    const { jobTitle, resumeContent } = this.data;
    this.setData({
      canSubmit: jobTitle.trim().length > 0 && resumeContent.trim().length > 10
    });
  },

  onSubmit() {
    const { jobTitle, resumeContent, canSubmit, loading } = this.data;
    if (!canSubmit || loading) return;

    const usageCount = wx.getStorageSync('resume_usage_count') || 0;
    if (usageCount >= 1 && !this.data.isBooked) {
      this.setData({ showBookingModal: true });
      const app = getApp();
      app.trackEvent('show_modal', 'index');
      return;
    }

    this.setData({ loading: true });

    const app = getApp();
    app.trackEvent('submit_resume', 'index');

    wx.cloud.callFunction({
      name: 'resumeOptimize',
      data: {
        jobTitle: jobTitle.trim(),
        resumeContent: resumeContent.trim()
      }
    }).then(res => {
      const result = res.result;
      if (result.success) {
        const app = getApp();
        app.globalData.optimizeResult = result.data;
        
        const newCount = usageCount + 1;
        wx.setStorageSync('resume_usage_count', newCount);
        app.updateUserTag(null, newCount);
        
        wx.navigateTo({ url: '/pages/result/index' });
      } else {
        wx.showToast({ title: result.message || '优化失败', icon: 'none' });
      }
    }).catch(err => {
      console.error('调用失败', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
    });
  },

  onCloseBookingModal() {
    this.setData({ showBookingModal: false });
    const app = getApp();
    app.trackEvent('click_cancel', 'index');
  },

  onBooking() {
    const app = getApp();
    app.trackEvent('click_book', 'index');
    
    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'book', source: 'index' }
    }).then(res => {
      const result = res.result;
      if (result && result.success) {
        wx.setStorageSync('has_booked', true);
        app.updateUserTag('booked');
        
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
