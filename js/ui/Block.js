/**
 * 滑块组件
 * 数字华容道的方块，支持平滑位移动画
 * 预留 drawImage 分支用于未来替换图片纹理
 */

import { Tween, Easing } from '../utils/Tween.js';
import { assetManager } from '../assets/AssetManager.js';

export class Block {
  constructor(options = {}) {
    this.value = options.value || 0;  // 0 表示空格
    this.row = options.row || 0;
    this.col = options.col || 0;
    this.targetRow = this.row;
    this.targetCol = this.col;
    
    // 位置和大小
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 80;
    this.height = options.height || 80;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // 颜色配置
    this.bgColor = options.bgColor || this._getDefaultColor(this.value);
    this.textColor = options.textColor || '#FFFFFF';
    this.borderRadius = options.borderRadius || 8;
    
    // 渐变配置
    this.useGradient = options.useGradient !== false;
    this.gradientStart = options.gradientStart || null;
    this.gradientEnd = options.gradientEnd || null;
    
    // 阴影
    this.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.15)';
    this.shadowBlur = options.shadowBlur || 6;
    this.shadowOffsetX = options.shadowOffsetX || 0;
    this.shadowOffsetY = options.shadowOffsetY || 3;
    
    // 图片资源key（未来使用）
    this.imageKey = options.imageKey || null;
    
    // 状态
    this.visible = true;
    this.scale = 1;
    this.opacity = 1;
    this.isMoving = false;
    
    // 动画
    this.moveTween = null;
  }

  /**
   * 根据数值获取默认颜色
   */
  _getDefaultColor(value) {
    if (value === 0) return '#E8E8E8';  // 空格颜色
    
    // 数字方块使用蓝色系渐变
    const colors = [
      '#4A90D9', '#5A9EE8', '#6AACF7',
      '#3A80C9', '#2A70B9', '#1A60A9',
      '#5B8FD4', '#6B9FE4', '#7BAFF4'
    ];
    return colors[(value - 1) % colors.length] || '#4A90D9';
  }

  /**
   * 设置网格位置（逻辑位置）
   */
  setGridPosition(row, col, animate = true) {
    this.targetRow = row;
    this.targetCol = col;
    
    // 计算目标像素位置（由外部传入或计算）
    // 这里只记录逻辑位置，像素位置由外部更新
  }

  /**
   * 设置像素位置
   */
  setPixelPosition(x, y, animate = true, duration = 130) {
    this.targetX = x;
    this.targetY = y;
    
    if (!animate) {
      this.x = x;
      this.y = y;
      return Promise.resolve();
    }
    
    this.isMoving = true;
    
    // 停止之前的动画
    if (this.moveTween) {
      this.moveTween.stop();
    }
    
    return new Promise(resolve => {
      this.moveTween = new Tween(this)
        .to({ x: x, y: y }, duration)
        .easing(Easing.easeInOutQuad)
        .onComplete(() => {
          this.isMoving = false;
          this.row = this.targetRow;
          this.col = this.targetCol;
          resolve();
        })
        .start();
    });
  }

  /**
   * 点击动画
   */
  playClickAnimation() {
    if (this.value === 0) return; // 空格无动画
    
    new Tween(this)
      .to({ scale: 0.92 }, 80)
      .easing(Easing.easeOutQuad)
      .onComplete(() => {
        new Tween(this)
          .to({ scale: 1 }, 120)
          .easing(Easing.easeOutBack)
          .start();
      })
      .start();
  }

  /**
   * 入场动画
   */
  playEnterAnimation(delay = 0) {
    // 初始状态可见但稍小
    this.opacity = 1;
    this.scale = 0.8;
    
    setTimeout(() => {
      new Tween(this)
        .to({ scale: 1 }, 200)
        .easing(Easing.easeOutBack)
        .start();
    }, delay);
  }

  /**
   * 检查点是否在方块内
   */
  contains(x, y) {
    if (!this.visible || this.value === 0) return false;
    
    return x >= this.x && 
           x <= this.x + this.width * this.scale && 
           y >= this.y && 
           y <= this.y + this.height * this.scale;
  }

  /**
   * 绘制方块
   */
  draw(ctx) {
    if (!this.visible) return;
    
    // 空格不绘制（value=0 表示空格）
    if (this.value === 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    const drawWidth = this.width * this.scale;
    const drawHeight = this.height * this.scale;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const drawX = centerX - drawWidth / 2;
    const drawY = centerY - drawHeight / 2;
    const radius = this.borderRadius * this.scale;
    
    // 如果有图片资源且已加载，使用图片绘制
    const image = this.imageKey ? assetManager.getImage(this.imageKey) : null;
    
    if (image) {
      this._drawImage(ctx, image, drawX, drawY, drawWidth, drawHeight);
    } else {
      this._drawRectangle(ctx, drawX, drawY, drawWidth, drawHeight, radius);
    }
    
    ctx.restore();
  }

  /**
   * 绘制图片方块（未来使用）
   */
  _drawImage(ctx, image, x, y, width, height) {
    // 绘制阴影
    ctx.save();
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
    
    // 绘制图片
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();
    
    // 绘制数字（如果需要）
    if (this.value > 0) {
      this._drawNumber(ctx, x, y, width, height);
    }
  }

  /**
   * 绘制圆角矩形色块（当前默认）
   */
  _drawRectangle(ctx, x, y, width, height, radius) {
    // 绘制阴影
    ctx.save();
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.shadowBlur;
    ctx.shadowOffsetX = this.shadowOffsetX;
    ctx.shadowOffsetY = this.shadowOffsetY;
    
    // 绘制圆角矩形
    this._drawRoundRectPath(ctx, x, y, width, height, radius);
    
    if (this.useGradient && this.value > 0) {
      // 使用渐变
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      const startColor = this.gradientStart || this._lightenColor(this.bgColor, 20);
      const endColor = this.gradientEnd || this.bgColor;
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = this.bgColor;
    }
    
    ctx.fill();
    ctx.restore();
    
    // 绘制边框高光
    if (this.value > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      this._drawRoundRectPath(ctx, x + 1, y + 1, width - 2, height / 2, radius);
      ctx.stroke();
      ctx.restore();
    }
    
    // 绘制数字
    if (this.value > 0) {
      this._drawNumber(ctx, x, y, width, height);
    }
  }

  /**
   * 绘制数字
   */
  _drawNumber(ctx, x, y, width, height) {
    const fontSize = Math.min(width, height) * 0.5;
    ctx.fillStyle = this.textColor;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加文字阴影增强可读性
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(this.value.toString(), x + width / 2, y + height / 2 + fontSize * 0.08);
    ctx.restore();
  }

  /**
   * 绘制圆角矩形路径
   */
  _drawRoundRectPath(ctx, x, y, width, height, radius) {
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
   * 颜色变亮辅助函数
   */
  _lightenColor(color, percent) {
    // 如果颜色不是十六进制格式，直接返回原色
    if (!color || !color.startsWith('#')) {
      return color || '#4A90D9';
    }
    
    try {
      const num = parseInt(color.replace('#', ''), 16);
      if (isNaN(num)) return color;
      
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, ((num >> 16) & 0xFF) + amt);
      const G = Math.min(255, ((num >> 8) & 0xFF) + amt);
      const B = Math.min(255, (num & 0xFF) + amt);
      
      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');
      
      return '#' + rHex + gHex + bHex;
    } catch (e) {
      return color;
    }
  }

  /**
   * 销毁方块
   */
  destroy() {
    if (this.moveTween) {
      this.moveTween.stop();
    }
  }
}

export default Block;
