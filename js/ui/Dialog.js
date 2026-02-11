/**
 * 弹窗组件
 * 支持淡入淡出 + 缩放动画
 */

import { Tween, Easing } from '../utils/Tween.js';
import { Button } from './Button.js';

export class Dialog {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || 400;
    this.height = options.height || 300;
    
    // 样式
    this.bgColor = options.bgColor || '#FFFFFF';
    this.borderRadius = options.borderRadius || 16;
    this.overlayColor = options.overlayColor || 'rgba(0, 0, 0, 0.5)';
    
    // 标题
    this.title = options.title || '';
    this.titleColor = options.titleColor || '#333333';
    this.titleFontSize = options.titleFontSize || 36;
    
    // 内容
    this.content = options.content || '';
    this.contentColor = options.contentColor || '#666666';
    this.contentFontSize = options.contentFontSize || 28;
    
    // 阴影
    this.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.3)';
    this.shadowBlur = options.shadowBlur || 20;
    
    // 状态
    this.visible = false;
    this.opacity = 0;
    this.scale = 0.8;
    this.isAnimating = false;
    
    // 按钮
    this.buttons = [];
    this.confirmButton = null;
    
    // 动画
    this.tween = null;
  }

  /**
   * 创建确认按钮
   */
  addConfirmButton(text = '确认', onClick) {
    this.confirmButton = new Button({
      text: text,
      width: 160,
      height: 56,
      fontSize: 26,
      bgColor: '#4A90D9',
      onClick: () => {
        this.hide().then(() => {
          if (onClick) onClick();
        });
      }
    });
    this.buttons.push(this.confirmButton);
    this._layoutButtons();
    return this.confirmButton;
  }

  /**
   * 添加自定义按钮
   */
  addButton(button) {
    this.buttons.push(button);
    this._layoutButtons();
    return button;
  }

  /**
   * 布局按钮
   */
  _layoutButtons() {
    const buttonY = this.y + this.height / 2 - 50;
    const totalWidth = this.buttons.length * 180 - 20;
    let startX = this.x - totalWidth / 2 + 90;
    
    for (let button of this.buttons) {
      button.setPosition(startX, buttonY);
      startX += 180;
    }
  }

  /**
   * 显示弹窗
   */
  show() {
    if (this.visible && !this.isAnimating) return Promise.resolve();
    
    this.visible = true;
    this.isAnimating = true;
    this.opacity = 0;
    this.scale = 0.8;
    
    // 按钮也隐藏
    for (let button of this.buttons) {
      button.opacity = 0;
    }
    
    return new Promise(resolve => {
      if (this.tween) {
        this.tween.stop();
      }
      
      this.tween = new Tween(this)
        .to({ opacity: 1, scale: 1 }, 250)
        .easing(Easing.easeOutBack)
        .onUpdate(() => {
          // 同步按钮透明度
          for (let button of this.buttons) {
            button.opacity = this.opacity;
          }
        })
        .onComplete(() => {
          this.isAnimating = false;
          resolve();
        })
        .start();
    });
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    if (!this.visible && !this.isAnimating) return Promise.resolve();
    
    this.isAnimating = true;
    
    return new Promise(resolve => {
      if (this.tween) {
        this.tween.stop();
      }
      
      this.tween = new Tween(this)
        .to({ opacity: 0, scale: 0.9 }, 200)
        .easing(Easing.easeInQuad)
        .onUpdate(() => {
          // 同步按钮透明度
          for (let button of this.buttons) {
            button.opacity = this.opacity;
          }
        })
        .onComplete(() => {
          this.visible = false;
          this.isAnimating = false;
          resolve();
        })
        .start();
    });
  }

  /**
   * 处理触摸事件
   */
  onTouchStart(x, y) {
    if (!this.visible) return false;
    
    for (let button of this.buttons) {
      if (button.onTouchStart(x, y)) {
        return true;
      }
    }
    
    // 点击遮罩层不处理（防止穿透）
    return this._isInDialogArea(x, y);
  }

  onTouchEnd(x, y) {
    if (!this.visible) return false;
    
    for (let button of this.buttons) {
      if (button.onTouchEnd(x, y)) {
        return true;
      }
    }
    
    return this._isInDialogArea(x, y);
  }

  /**
   * 检查点是否在弹窗区域内
   */
  _isInDialogArea(x, y) {
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    
    return x >= this.x - halfWidth && 
           x <= this.x + halfWidth && 
           y >= this.y - halfHeight && 
           y <= this.y + halfHeight;
  }

  /**
   * 绘制弹窗
   */
  draw(ctx) {
    if (!this.visible || this.opacity <= 0.01) return;
    
    ctx.save();
    
    // 绘制遮罩层
    ctx.fillStyle = this.overlayColor;
    ctx.globalAlpha = this.opacity * 0.5;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.globalAlpha = this.opacity;
    
    // 计算绘制位置和大小
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    const drawX = this.x - halfWidth;
    const drawY = this.y - halfHeight;
    const drawWidth = this.width * this.scale;
    const drawHeight = this.height * this.scale;
    const radius = this.borderRadius * this.scale;
    
    // 绘制阴影
    ctx.save();
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = this.shadowBlur * this.scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8 * this.scale;
    
    // 绘制背景
    this._drawRoundRect(ctx, drawX, drawY, drawWidth, drawHeight, radius);
    ctx.fillStyle = this.bgColor;
    ctx.fill();
    ctx.restore();
    
    // 绘制标题
    if (this.title) {
      ctx.fillStyle = this.titleColor;
      ctx.font = `bold ${this.titleFontSize * this.scale}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.title, this.x, drawY + 40 * this.scale);
    }
    
    // 绘制内容
    if (this.content) {
      ctx.fillStyle = this.contentColor;
      ctx.font = `${this.contentFontSize * this.scale}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // 简单的文本换行处理
      const maxWidth = drawWidth - 60 * this.scale;
      const lineHeight = this.contentFontSize * this.scale * 1.5;
      const lines = this._wrapText(ctx, this.content, maxWidth);
      let contentY = drawY + 100 * this.scale;
      
      for (let line of lines) {
        ctx.fillText(line, this.x, contentY);
        contentY += lineHeight;
      }
    }
    
    ctx.restore();
    
    // 绘制按钮
    for (let button of this.buttons) {
      button.draw(ctx);
    }
  }

  /**
   * 绘制圆角矩形
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
   * 文本换行
   */
  _wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    
    return lines;
  }

  /**
   * 销毁弹窗
   */
  destroy() {
    if (this.tween) {
      this.tween.stop();
    }
    for (let button of this.buttons) {
      button.destroy();
    }
  }
}

export default Dialog;
