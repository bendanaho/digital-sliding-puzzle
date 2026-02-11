/**
 * 按钮组件
 * 支持圆角矩形色块、文字、点击动画
 * 预留 drawImage 分支用于未来替换图片资源
 */

import { Tween, Easing } from '../utils/Tween.js';
import { assetManager } from '../assets/AssetManager.js';
import { audioManager, SoundType } from '../audio/AudioManager.js';

export class Button {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 200;
    this.height = options.height || 60;
    this.text = options.text || '';
    this.fontSize = options.fontSize || 28;
    
    // 颜色配置
    this.bgColor = options.bgColor || '#4A90D9';
    this.bgColorHover = options.bgColorHover || '#5AA0E9';
    this.bgColorActive = options.bgColorActive || '#3A80C9';
    this.textColor = options.textColor || '#FFFFFF';
    this.borderRadius = options.borderRadius || 12;
    
    // 阴影配置
    this.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.2)';
    this.shadowBlur = options.shadowBlur || 8;
    this.shadowOffsetX = options.shadowOffsetX || 0;
    this.shadowOffsetY = options.shadowOffsetY || 4;
    
    // 图片资源key（未来使用）
    this.imageKey = options.imageKey || null;
    
    // 状态
    this.visible = true;
    this.enabled = true;
    this.isPressed = false;
    this.isHovered = false;
    this.scale = 1;
    this.opacity = 1;
    
    // 动画
    this.tween = null;
    
    // 回调
    this.onClick = options.onClick || null;
  }

  /**
   * 设置位置
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置大小
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * 检查点是否在按钮内
   */
  contains(x, y) {
    if (!this.visible || !this.enabled) return false;
    
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    
    return x >= this.x - halfWidth && 
           x <= this.x + halfWidth && 
           y >= this.y - halfHeight && 
           y <= this.y + halfHeight;
  }

  /**
   * 处理触摸开始
   */
  onTouchStart(x, y) {
    if (!this.contains(x, y)) return false;
    
    this.isPressed = true;
    this.playPressAnimation();
    return true;
  }

  /**
   * 处理触摸结束
   */
  onTouchEnd(x, y) {
    const wasPressed = this.isPressed;
    this.isPressed = false;
    this.playReleaseAnimation();
    
    if (wasPressed && this.contains(x, y)) {
      // 播放点击音效
      audioManager.play(SoundType.BUTTON_CLICK);
      
      // 执行回调
      if (this.onClick) {
        this.onClick();
      }
      return true;
    }
    return false;
  }

  /**
   * 按下动画
   */
  playPressAnimation() {
    if (this.tween) {
      this.tween.stop();
    }
    
    this.tween = new Tween(this)
      .to({ scale: 0.95 }, 100)
      .easing(Easing.easeOutQuad)
      .start();
  }

  /**
   * 释放动画
   */
  playReleaseAnimation() {
    if (this.tween) {
      this.tween.stop();
    }
    
    this.tween = new Tween(this)
      .to({ scale: 1 }, 150)
      .easing(Easing.easeOutBack)
      .start();
  }

  /**
   * 入场动画
   */
  playEnterAnimation(delay = 0) {
    this.opacity = 0;
    this.scale = 0.8;
    
    setTimeout(() => {
      new Tween(this)
        .to({ opacity: 1, scale: 1 }, 300)
        .easing(Easing.easeOutBack)
        .start();
    }, delay);
  }

  /**
   * 出场动画
   */
  playExitAnimation() {
    return new Promise(resolve => {
      new Tween(this)
        .to({ opacity: 0, scale: 0.9 }, 200)
        .easing(Easing.easeInQuad)
        .onComplete(() => {
          resolve();
        })
        .start();
    });
  }

  /**
   * 绘制按钮
   */
  draw(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    const drawX = this.x - halfWidth;
    const drawY = this.y - halfHeight;
    const drawWidth = this.width * this.scale;
    const drawHeight = this.height * this.scale;
    
    // 如果有图片资源且已加载，使用图片绘制
    const image = this.imageKey ? assetManager.getImage(this.imageKey) : null;
    
    if (image) {
      this._drawImage(ctx, image, drawX, drawY, drawWidth, drawHeight);
    } else {
      this._drawRectangle(ctx, drawX, drawY, drawWidth, drawHeight);
    }
    
    // 绘制文字
    this._drawText(ctx, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  }

  /**
   * 绘制图片按钮（未来使用）
   */
  _drawImage(ctx, image, x, y, width, height) {
    // 预留：使用 drawImage 绘制图片按钮
    // 可根据状态切换不同图片资源
    ctx.drawImage(image, x, y, width, height);
    
    // 按下时添加半透明遮罩
    if (this.isPressed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * 绘制圆角矩形按钮（当前默认）
   */
  _drawRectangle(ctx, x, y, width, height) {
    const radius = this.borderRadius * this.scale;
    
    // 确定颜色
    let bgColor = this.bgColor;
    if (this.isPressed) {
      bgColor = this.bgColorActive;
    } else if (this.isHovered) {
      bgColor = this.bgColorHover;
    }
    
    // 绘制阴影
    if (!this.isPressed) {
      ctx.save();
      ctx.shadowColor = this.shadowColor;
      ctx.shadowBlur = this.shadowBlur * this.scale;
      ctx.shadowOffsetX = this.shadowOffsetX * this.scale;
      ctx.shadowOffsetY = this.shadowOffsetY * this.scale;
    }
    
    // 绘制圆角矩形
    this._drawRoundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = bgColor;
    ctx.fill();
    
    if (!this.isPressed) {
      ctx.restore();
    }
    
    // 绘制边框高光（增加立体感）
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    this._drawRoundRect(ctx, x + 1, y + 1, width - 2, height / 2, radius);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 绘制圆角矩形路径
   */
  _drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 绘制文字
   */
  _drawText(ctx, x, y, width, height) {
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${this.fontSize * this.scale}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, x + width / 2, y + height / 2 + 2 * this.scale);
  }

  /**
   * 销毁按钮
   */
  destroy() {
    if (this.tween) {
      this.tween.stop();
    }
  }
}

export default Button;
