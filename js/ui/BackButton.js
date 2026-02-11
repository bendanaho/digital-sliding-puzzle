/**
 * 返回按钮组件
 * 使用 Canvas 绘制返回箭头图标
 * 预留 drawImage 分支用于未来替换图片资源
 */

import { Button } from './Button.js';
import { assetManager } from '../assets/AssetManager.js';

export class BackButton extends Button {
  constructor(options = {}) {
    super({
      width: options.width || 50,
      height: options.height || 50,
      bgColor: options.bgColor || 'rgba(150, 150, 150, 0.3)',
      bgColorHover: options.bgColorHover || 'rgba(150, 150, 150, 0.5)',
      bgColorActive: options.bgColorActive || 'rgba(120, 120, 120, 0.4)',
      borderRadius: options.borderRadius || 8,
      onClick: options.onClick
    });
    
    // 箭头颜色
    this.arrowColor = options.arrowColor || '#888888';
    this.arrowSize = options.arrowSize || 20;
    
    // 图片资源key（未来使用）
    this.imageKey = options.imageKey || 'back_icon';
  }

  /**
   * 绘制按钮
   */
  draw(ctx) {
    if (!this.visible || this.opacity <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    const drawX = this.x - halfWidth;
    const drawY = this.y - halfHeight;
    const drawWidth = this.width * this.scale;
    const drawHeight = this.height * this.scale;
    
    // 如果有图片资源且已加载，使用图片
    const image = this.imageKey ? assetManager.getImage(this.imageKey) : null;
    
    if (image) {
      this._drawImageButton(ctx, image, drawX, drawY, drawWidth, drawHeight);
    } else {
      this._drawArrowButton(ctx, drawX, drawY, drawWidth, drawHeight);
    }
    
    ctx.restore();
  }

  /**
   * 绘制图片按钮（未来使用）
   */
  _drawImageButton(ctx, image, x, y, width, height) {
    // 绘制背景
    const radius = this.borderRadius * this.scale;
    this._drawRoundRect(ctx, x, y, width, height, radius);
    
    let bgColor = this.bgColor;
    if (this.isPressed) {
      bgColor = this.bgColorActive;
    } else if (this.isHovered) {
      bgColor = this.bgColorHover;
    }
    
    ctx.fillStyle = bgColor;
    ctx.fill();
    
    // 绘制图片
    const padding = 8 * this.scale;
    ctx.drawImage(image, 
      x + padding, y + padding, 
      width - padding * 2, height - padding * 2
    );
  }

  /**
   * 绘制箭头按钮（当前默认）
   */
  _drawArrowButton(ctx, x, y, width, height) {
    const radius = this.borderRadius * this.scale;
    
    // 确定背景颜色
    let bgColor = this.bgColor;
    if (this.isPressed) {
      bgColor = this.bgColorActive;
    } else if (this.isHovered) {
      bgColor = this.bgColorHover;
    }
    
    // 绘制背景
    this._drawRoundRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = bgColor;
    ctx.fill();
    
    // 绘制返回箭头
    const centerX = this.x;
    const centerY = this.y;
    const arrowSize = this.arrowSize * this.scale;
    const lineWidth = 3 * this.scale;
    
    ctx.strokeStyle = this.arrowColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    // 箭头主体（左向）
    ctx.moveTo(centerX + arrowSize / 2, centerY - arrowSize / 2);
    ctx.lineTo(centerX - arrowSize / 3, centerY);
    ctx.lineTo(centerX + arrowSize / 2, centerY + arrowSize / 2);
    ctx.stroke();
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
}

export default BackButton;
