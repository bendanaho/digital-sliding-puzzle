/**
 * Tween 动画系统
 * 统一的动画管理工具
 */
import { Easing } from './Easing.js';

// 当前活动的所有tween
let activeTweens = [];
let isRunning = false;

export class Tween {
  constructor(target) {
    this.target = target;
    this.toValues = {};
    this.duration = 300;
    this.easingFunction = Easing.easeOutQuad;
    this.onUpdateCallback = null;
    this.onCompleteCallback = null;
    this.startTime = 0;
    this.startValues = {};
    this.isPlaying = false;
  }

  to(properties, duration) {
    this.toValues = properties;
    if (duration !== undefined) {
      this.duration = duration;
    }
    return this;
  }

  easing(func) {
    this.easingFunction = func;
    return this;
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback;
    return this;
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
    return this;
  }

  start() {
    this.startTime = Date.now();
    this.isPlaying = true;

    // 记录起始值
    for (let key in this.toValues) {
      this.startValues[key] = this.target[key];
    }

    if (!activeTweens.includes(this)) {
      activeTweens.push(this);
    }
    startLoop();
    return this;
  }

  stop() {
    this.isPlaying = false;
    const index = activeTweens.indexOf(this);
    if (index > -1) {
      activeTweens.splice(index, 1);
    }
    return this;
  }

  update(currentTime) {
    if (!this.isPlaying) return false;

    const elapsed = currentTime - this.startTime;
    let progress = Math.min(elapsed / this.duration, 1);
    
    // 应用缓动函数
    const easedProgress = this.easingFunction(progress);

    // 更新目标属性
    for (let key in this.toValues) {
      const start = this.startValues[key];
      const end = this.toValues[key];
      this.target[key] = start + (end - start) * easedProgress;
    }

    // 回调
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.target);
    }

    // 完成
    if (progress >= 1) {
      this.isPlaying = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.target);
      }
      return true; // 表示已完成
    }

    return false;
  }
}

// 动画循环
function updateLoop() {
  if (activeTweens.length === 0) {
    isRunning = false;
    return;
  }

  const currentTime = Date.now();
  const completedTweens = [];

  for (let tween of activeTweens) {
    if (tween.update(currentTime)) {
      completedTweens.push(tween);
    }
  }

  // 移除已完成的tween
  for (let tween of completedTweens) {
    const index = activeTweens.indexOf(tween);
    if (index > -1) {
      activeTweens.splice(index, 1);
    }
  }

  if (activeTweens.length > 0) {
    // 使用 setTimeout 实现动画循环
    setTimeout(updateLoop, 16);
  } else {
    isRunning = false;
  }
}

function startLoop() {
  if (!isRunning) {
    isRunning = true;
    updateLoop();
  }
}

// 工具函数：创建延迟动画
export function delay(duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

// 工具函数：等待所有tween完成
export function waitAllTweens() {
  return new Promise(resolve => {
    const check = () => {
      if (activeTweens.length === 0) {
        resolve();
      } else {
        setTimeout(check, 16);
      }
    };
    check();
  });
}

// 停止所有动画
export function stopAllTweens() {
  activeTweens.forEach(tween => tween.stop());
  activeTweens = [];
  isRunning = false;
}

// 重新导出 Easing，方便其他模块统一从 Tween 模块导入
export { Easing };

export default Tween;
