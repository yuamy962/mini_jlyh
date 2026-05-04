// index.js
Page({
  data: {
    jobTitle: '',
    resumeContent: '',
    contentLength: 0,
    wordCountStatus: '',
    wordCountHint: '',
    canSubmit: false,
    loading: false,
    showBookingModal: false,
    showSuccessModal: false,
    bookingCount: 1023,
    isBooked: false
  },

  onLoad() {
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
    const len = value.length;
    this.setData({ 
      resumeContent: value, 
      contentLength: len 
    });
    this.updateWordCountHint(len);
    this.checkCanSubmit();
  },

  updateWordCountHint(len) {
    let status = '';
    let hint = '';
    if (len > 0 && len < 100) {
      status = 'warning';
      hint = '（内容过少）';
    } else if (len > 2000) {
      status = 'too-much';
      hint = '（内容较长）';
    } else if (len >= 100) {
      status = 'normal';
    }
    this.setData({ wordCountStatus: status, wordCountHint: hint });
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        const text = res.data || '';
        if (!text.trim()) {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }
        this.setData({ 
          resumeContent: text, 
          contentLength: text.length 
        });
        this.updateWordCountHint(text.length);
        this.checkCanSubmit();
        wx.showToast({ title: '已粘贴', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '无法读取剪贴板', icon: 'none' });
      }
    });
  },

  checkCanSubmit() {
    const { jobTitle, resumeContent } = this.data;
    this.setData({
      canSubmit: jobTitle.trim().length > 0 && resumeContent.trim().length > 10
    });
  },

  onSubmit() {
    const { jobTitle, resumeContent, canSubmit, loading, contentLength } = this.data;
    if (!canSubmit || loading) return;

    // 岗位为空校验
    if (!jobTitle.trim()) {
      wx.showToast({ title: '请输入目标岗位', icon: 'none' });
      return;
    }

    // 简历内容为空校验
    if (!resumeContent.trim()) {
      wx.showToast({ title: '请粘贴简历内容', icon: 'none' });
      return;
    }

    // 内容过少校验
    if (contentLength < 100) {
      wx.showModal({
        title: '内容较少',
        content: '内容过少，建议补充工作经历或项目经验，优化效果会更好。是否继续？',
        confirmText: '继续',
        cancelText: '去补充',
        success: (res) => {
          if (res.confirm) this.doSubmit();
        }
      });
      return;
    }

    if (resumeContent.length > 8000) {
      wx.showModal({
        title: '提示',
        content: '简历内容过长（超过8000字），可能导致优化效果下降，是否继续？',
        success: (res) => {
          if (res.confirm) this.doSubmit();
        }
      });
      return;
    }

    this.doSubmit();
  },

  doSubmit() {
    const { jobTitle, resumeContent } = this.data;
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
      wx.showToast({ title: '网络异常，请检查网络后重试', icon: 'none' });
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
  },

  // 长按标题清除缓存（测试用）
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地测试数据吗？（使用次数、预约状态）',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('resume_usage_count');
          wx.removeStorageSync('has_booked');
          wx.removeStorageSync('optimizeResult');
          this.setData({ isBooked: false });
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  // 跳转数据看板
  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/index' });
  }
});
