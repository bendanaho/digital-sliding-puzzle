/**
 * 缓动函数集合
 * 参考: https://easings.net/
 */
export const Easing = {
  // 线性
  linear: t => t,

  // 二次方
  easeInQuad: t => t * t,
  easeOutQuad: t => 1 - (1 - t) * (1 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // 三次方
  easeInCubic: t => t * t * t,
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // 四次方
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  // 五次方
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  // 指数
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // 弹性
  easeOutBack: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // 弹跳
  easeOutBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

// 默认导出常用缓动
export default Easing;
