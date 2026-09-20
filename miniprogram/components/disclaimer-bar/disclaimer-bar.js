const { product } = require("../../config/product");

Component({
  data: {
    open: false,
    disclaimer: product.disclaimer,
  },
  methods: {
    openDisclaimer() {
      this.setData({ open: true });
    },
    closeDisclaimer() {
      this.setData({ open: false });
    },
    stopPropagation() {},
  },
});
