/**
 * 场景基类
 * 所有场景的公共逻辑
 */

import { Tween, Easing } from '../utils/Tween.js';

export class BaseScene {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    // 使用屏幕逻辑尺寸，而非 Canvas 像素尺寸
    const sysInfo = wx.getSystemInfoSync();
    this.width = sysInfo.windowWidth;
    this.height = sysInfo.windowHeight;
    
    // 场景状态
    this.visible = false;
    this.opacity = 0;
    this.isTransitioning = false;
    
    // UI元素
    this.uiElements = [];
    
    // 动画
    this.enterTween = null;
    this.exitTween = null;
  }

  /**
   * 场景初始化（子类重写）
   */
  init() {
    // 子类实现
  }

  /**
   * 更新布局（屏幕适配）
   */
  updateLayout() {
    // 使用屏幕逻辑尺寸，而非 Canvas 像素尺寸
    const sysInfo = wx.getSystemInfoSync();
    this.width = sysInfo.windowWidth;
    this.height = sysInfo.windowHeight;
    // 子类实现具体布局
  }

  /**
   * 进入场景动画
   */
  async enter() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.visible = true;
    this.opacity = 1;
    
    return new Promise(resolve => {
      if (this.enterTween) {
        this.enterTween.stop();
      }
      
      this.onEnter();
      this.isTransitioning = false;
      resolve();
    });
  }

  /**
   * 离开场景动画
   */
  async exit() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    return new Promise(resolve => {
      if (this.exitTween) {
        this.exitTween.stop();
      }
      
      this.visible = false;
      this.isTransitioning = false;
      this.onExit();
      resolve();
    });
  }

  /**
   * 进入完成回调（子类重写）
   */
  onEnter() {
    // 子类实现
  }

  /**
   * 离开完成回调（子类重写）
   */
  onExit() {
    // 子类实现
  }

  /**
   * 处理触摸开始（子类重写）
   */
  onTouchStart(x, y) {
    for (let element of this.uiElements) {
      if (element.onTouchStart && element.onTouchStart(x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 处理触摸移动（子类重写）
   */
  onTouchMove(x, y) {
    // 子类实现
  }

  /**
   * 处理触摸结束（子类重写）
   */
  onTouchEnd(x, y) {
    for (let element of this.uiElements) {
      if (element.onTouchEnd && element.onTouchEnd(x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 绘制场景（子类重写）
   */
  draw() {
    if (!this.visible) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    
    this._drawBackground();
    this._drawContent();
    this._drawUI();
    
    this.ctx.restore();
  }

  /**
   * 绘制背景（子类重写）
   */
  _drawBackground() {
    // 默认白色背景
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制内容（子类重写）
   */
  _drawContent() {
    // 子类实现
  }

  /**
   * 绘制UI
   */
  _drawUI() {
    for (let element of this.uiElements) {
      if (element.draw) {
        element.draw(this.ctx);
      }
    }
  }

  /**
   * 销毁场景
   */
  destroy() {
    if (this.enterTween) {
      this.enterTween.stop();
    }
    if (this.exitTween) {
      this.exitTween.stop();
    }
    for (let element of this.uiElements) {
      if (element.destroy) {
        element.destroy();
      }
    }
    this.uiElements = [];
  }
}

export default BaseScene;
