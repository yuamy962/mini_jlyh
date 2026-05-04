Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    bookingCount: {
      type: Number,
      value: 1023
    }
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close');
    },
    
    onModalTap() {
      // 阻止冒泡，防止点击模态框内容时关闭
    },

    onCancel() {
      this.triggerEvent('close');
    },

    onBooking() {
      this.triggerEvent('confirm');
    }
  }
});
