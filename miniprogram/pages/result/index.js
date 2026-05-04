// pages/result/index.js
Page({
  data: {
    result: null
  },

  onLoad() {
    const app = getApp();
    const result = app.globalData.optimizeResult;
    
    if (!result) {
      wx.showToast({
        title: '暂无优化结果',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ result });
  }
});
