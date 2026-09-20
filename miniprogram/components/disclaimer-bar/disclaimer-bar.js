const { product } = require("../../config/product");

Component({
  options: {
    styleIsolation: "apply-shared",
  },
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
