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
    isBooked: false,
    pdfUploading: false,
    pdfUploadStatus: '',
    pdfParsed: false,
    pdfFileName: '',
    parsedPageCount: 0
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

  // 选择并上传PDF简历
  onUploadPdf() {
    if (this.data.pdfUploading) return;

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
          wx.showToast({ title: '请选择PDF文件', icon: 'none' });
          return;
        }
        this.uploadAndParsePdf(file);
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消，不做处理
          return;
        }
        console.error('选择文件失败', err);
        wx.showToast({ title: '选择文件失败', icon: 'none' });
      }
    });
  },

  // 上传PDF到云存储并解析
  uploadAndParsePdf(file) {
    this.setData({
      pdfUploading: true,
      pdfUploadStatus: '正在上传...',
      pdfParsed: false
    });

    const cloudPath = `resumes/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath: file.path,
      success: (uploadRes) => {
        const fileID = uploadRes.fileID;
        this.setData({ pdfUploadStatus: '正在识别文字...' });
        this.parsePdfText(fileID, file.name);
      },
      fail: (err) => {
        console.error('上传失败', err);
        this.setData({ pdfUploading: false });
        wx.showToast({ title: '上传失败，请重试', icon: 'none' });
      }
    });
  },

  // 调用云函数解析PDF文字
  parsePdfText(fileID, fileName) {
    wx.cloud.callFunction({
      name: 'parseResume',
      data: { fileID }
    }).then(res => {
      const result = res.result;
      this.setData({ pdfUploading: false });

      if (result.success) {
        const text = result.data.text || '';
        const pageCount = result.data.pageCount || 1;

        this.setData({
          resumeContent: text,
          contentLength: text.length,
          pdfParsed: true,
          pdfFileName: fileName,
          parsedPageCount: pageCount
        });
        this.updateWordCountHint(text.length);
        this.checkCanSubmit();

        wx.showToast({
          title: `已识别 ${pageCount} 页 · ${text.length} 字`,
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showModal({
          title: '识别失败',
          content: result.message || '无法解析该PDF，请尝试手动粘贴简历内容',
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    }).catch(err => {
      console.error('解析失败', err);
      this.setData({ pdfUploading: false });
      wx.showModal({
        title: '识别失败',
        content: '网络异常，无法解析PDF，请尝试手动粘贴',
        showCancel: false,
        confirmText: '我知道了'
      });
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
