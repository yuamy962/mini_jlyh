// index.js
Page({
  data: {
    jobTitle: '',
    resumeContent: '',
    contentLength: 0,
    canSubmit: false,
    loading: false
  },

  onLoad() {
    // 页面加载
  },

  onJobTitleInput(e) {
    this.setData({
      jobTitle: e.detail.value
    });
    this.checkCanSubmit();
  },

  onResumeInput(e) {
    const value = e.detail.value;
    this.setData({
      resumeContent: value,
      contentLength: value.length
    });
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

    this.setData({ loading: true });

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
        
        wx.navigateTo({
          url: '/pages/result/index'
        });
      } else {
        wx.showToast({
          title: result.message || '优化失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('调用失败', err);
      wx.showToast({
        title: '网络异常，请重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({ loading: false });
    });
  }
});
