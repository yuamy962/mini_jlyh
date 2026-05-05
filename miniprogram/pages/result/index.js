// pages/result/index.js
Page({
  data: {
    result: null,
    showBookingModal: false,
    showSuccessModal: false,
    bookingCount: 1023,
    isBooked: false,
    isUnlocked: false,
    problemsPreview: [],
    problemsHidden: [],
    comparisons: [],
    previewComparison: null
  },

  onLoad() {
    const app = getApp();
    const result = app.globalData.optimizeResult;

    if (!result) {
      wx.showToast({ title: '暂无优化结果', icon: 'none' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
      return;
    }

    // 数据兼容处理
    const safeResult = {
      matchScore: result.matchScore || 0,
      optimizedResume: result.optimizedResume || '优化内容生成失败，请重试',
      problems: result.problems || [],
      optimizationNotes: result.optimizationNotes || '暂无优化说明',
      keyComparisons: result.keyComparisons || []
    };

    const problems = safeResult.problems;
    const problemsPreview = problems.slice(0, 2);
    const problemsHidden = problems.slice(2);

    // 解析对比高亮
    const comparisons = (safeResult.keyComparisons || []).map(item => ({
      ...item,
      afterParts: this.parseHighlight(item.after)
    }));
    const previewComparison = comparisons.length > 0 ? comparisons[0] : null;

    const isBooked = wx.getStorageSync('has_booked') || false;
    const isUnlocked = result._unlocked || false;

    this.setData({
      result: safeResult,
      problemsPreview,
      problemsHidden,
      isBooked,
      isUnlocked,
      comparisons,
      previewComparison
    });

    this.fetchBookingStats();
  },

  onShow() {
    const isBooked = wx.getStorageSync('has_booked') || false;
    if (isBooked !== this.data.isBooked) {
      this.setData({ isBooked });
    }
  },

  parseHighlight(text) {
    if (!text) return [{ text: '', highlight: false }];
    const parts = text.split(/【|】/);
    return parts.map((part, index) => ({
      text: part,
      highlight: index % 2 === 1
    }));
  },

  fetchBookingStats() {
    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'stats' }
    }).then(res => {
      if (res.result && res.result.success) {
        this.setData({ bookingCount: res.result.totalCount || 1023 });
      }
    }).catch(err => {
      console.error('获取统计失败', err);
    });
  },

  onUnlockResume() {
    this.setData({ showBookingModal: true });
    const app = getApp();
    app.trackEvent('click_unlock', 'result');
    app.trackEvent('show_modal', 'result');
    app.updateUserTag('clicked_pay');
  },

  onMoreProblems() {
    this.setData({ showBookingModal: true });
    const app = getApp();
    app.trackEvent('click_unlock', 'result');
    app.trackEvent('show_modal', 'result');
    app.updateUserTag('clicked_pay');
  },

  onCloseBookingModal() {
    this.setData({ showBookingModal: false });
    const app = getApp();
    app.trackEvent('click_cancel', 'result');
  },

  onBooking() {
    const app = getApp();
    app.trackEvent('click_book', 'result');

    wx.cloud.callFunction({
      name: 'createReservation',
      data: { action: 'book', source: 'result' }
    }).then(res => {
      const result = res.result;
      if (result && result.success) {
        wx.setStorageSync('has_booked', true);
        app.updateUserTag('booked');

        // 解锁当前结果
        const appInstance = getApp();
        if (appInstance.globalData.optimizeResult) {
          appInstance.globalData.optimizeResult._unlocked = true;
        }

        this.setData({
          showBookingModal: false,
          showSuccessModal: true,
          isBooked: true,
          isUnlocked: true,
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
  },

  onReoptimize() {
    wx.navigateBack();
  }
});
