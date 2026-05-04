Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onMaskTap() {
      this.triggerEvent('close');
    },
    
    onModalTap() {
      // 阻止冒泡
    },

    onClose() {
      this.triggerEvent('close');
    }
  }
});
