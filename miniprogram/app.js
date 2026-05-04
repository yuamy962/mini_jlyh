// app.js
App({
  onLaunch: function () {
    this.globalData = {
      env: "",
      optimizeResult: null,
      userInfo: null
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },

  trackEvent(eventType, page, extraData) {
    wx.cloud.callFunction({
      name: 'trackEvent',
      data: { eventType, page, extraData }
    }).catch(() => {});
  },

  updateUserTag(tag, usageCount) {
    const data = { action: 'update' };
    if (tag) data.tag = tag;
    if (typeof usageCount === 'number') data.usageCount = usageCount;
    return wx.cloud.callFunction({
      name: 'getUserTag',
      data
    }).catch(() => {});
  }
});
