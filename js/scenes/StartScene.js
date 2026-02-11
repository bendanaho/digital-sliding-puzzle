/**
 * 开始页面场景
 * 显示标题、开始游戏按钮、健康游戏忠告
 */

import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { Tween, Easing, delay } from '../utils/Tween.js';
import { globalEvent } from '../utils/EventEmitter.js';

export class StartScene extends BaseScene {
  constructor(canvas, ctx) {
    super(canvas, ctx);
    
    // 标题
    this.title = '数字游走';
    this.titleY = 0;
    this.titleOpacity = 0;
    this.titleScale = 0.8;
    
    // 按钮
    this.startButton = null;
    
    // 健康游戏忠告
    this.healthTips = [
      '抵制不良游戏，拒绝盗版游戏',
      '注意自我保护，谨防受骗上当',
      '适度游戏益脑，沉迷游戏伤身',
      '合理安排时间，享受健康生活'
    ];
    this.tipOpacities = [0, 0, 0, 0];
    this.tipY = 0;
  }

  /**
   * 初始化
   */
  init() {
    this._createButton();
    this.updateLayout();
  }

  /**
   * 更新布局
   */
  updateLayout() {
    super.updateLayout();
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // 标题位置
    this.titleY = this.height * 0.25;
    
    // 按钮位置
    if (this.startButton) {
      this.startButton.setPosition(centerX, centerY);
    }
    
    // 健康忠告位置
    this.tipY = this.height * 0.75;
  }

  /**
   * 创建开始按钮
   */
  _createButton() {
    this.startButton = new Button({
      text: '开始游戏',
      width: 220,
      height: 70,
      fontSize: 32,
      bgColor: '#4A90D9',
      bgColorHover: '#5AA0E9',
      bgColorActive: '#3A80C9',
      borderRadius: 16,
      onClick: () => {
        this._onStartClick();
      }
    });
    
    this.uiElements.push(this.startButton);
  }

  /**
   * 开始按钮点击
   */
  _onStartClick() {
    globalEvent.emit('scene:change', 'mode');
  }

  /**
   * 进入动画
   */
  async enter() {
    // 重置动画状态（直接设置为可见）
    this.titleOpacity = 1;
    this.titleScale = 1;
    this.tipOpacities = [1, 1, 1, 1];
    
    // 确保场景可见
    this.visible = true;
    this.opacity = 1;
    
    // 确保按钮可见
    if (this.startButton) {
      this.startButton.opacity = 1;
      this.startButton.scale = 1;
    }
    
    // 执行基础进入动画
    await super.enter();
  }

  /**
   * 离开动画
   */
  async exit() {
    // 标题离开
    new Tween(this)
      .to({ titleOpacity: 0, titleScale: 0.9 }, 200)
      .easing(Easing.easeInQuad)
      .start();
    
    // 按钮离开
    await this.startButton.playExitAnimation();
    
    await super.exit();
  }

  /**
   * 绘制背景 - 柔和斜线渐变
   */
  _drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 1. 主背景 - 柔和的斜向渐变（从左上到右下）
    const mainGradient = ctx.createLinearGradient(0, 0, w, h);
    mainGradient.addColorStop(0, '#E8F4FD');    // 柔和的浅蓝
    mainGradient.addColorStop(0.3, '#F0F7FF');  // 更浅的蓝白
    mainGradient.addColorStop(0.7, '#F8F5FF');  // 淡淡的紫白
    mainGradient.addColorStop(1, '#F0F0FF');    // 柔和的淡紫
    
    ctx.fillStyle = mainGradient;
    ctx.fillRect(0, 0, w, h);
    
    // 2. 装饰性斜线条纹 - 非常细腻的线条
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 1;
    
    const lineSpacing = 60;
    const diagonalOffset = Math.max(w, h);
    
    // 从左上到右下的斜线
    ctx.beginPath();
    for (let i = -diagonalOffset; i < w + h + diagonalOffset; i += lineSpacing) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
    }
    ctx.stroke();
    
    // 3. 第二层斜线（更稀疏，颜色稍深）
    ctx.globalAlpha = 0.025;
    ctx.strokeStyle = '#8B7FD9';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = -diagonalOffset; i < w + h + diagonalOffset; i += lineSpacing * 3) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
    }
    ctx.stroke();
    ctx.restore();
    
    // 4. 顶部和底部的柔和光晕效果
    const topGlow = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    topGlow.addColorStop(0, 'rgba(135, 206, 250, 0.15)');
    topGlow.addColorStop(1, 'rgba(135, 206, 250, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, h * 0.4);
    
    const bottomGlow = ctx.createLinearGradient(0, h * 0.6, 0, h);
    bottomGlow.addColorStop(0, 'rgba(200, 180, 255, 0)');
    bottomGlow.addColorStop(1, 'rgba(200, 180, 255, 0.12)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    
    // 5. 角落装饰 - 柔和的光点
    this._drawCornerGlow(w * 0.15, h * 0.2, 120, 'rgba(74, 144, 217, 0.08)');
    this._drawCornerGlow(w * 0.85, h * 0.8, 100, 'rgba(139, 127, 217, 0.08)');
  }
  
  /**
   * 绘制角落光晕装饰
   */
  _drawCornerGlow(x, y, radius, color) {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制内容
   */
  _drawContent() {
    this._drawTitle();
    this._drawHealthTips();
  }

  /**
   * 绘制标题
   */
  _drawTitle() {
    const centerX = this.width / 2;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.titleOpacity;
    
    // 标题阴影
    this.ctx.shadowColor = 'rgba(74, 144, 217, 0.3)';
    this.ctx.shadowBlur = 20 * this.titleScale;
    this.ctx.shadowOffsetY = 8 * this.titleScale;
    
    // 标题文字
    const fontSize = 56 * this.titleScale;
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.title, centerX, this.titleY);
    
    // 装饰线
    const lineWidth = 120 * this.titleScale;
    const lineY = this.titleY + fontSize * 0.7;
    
    this.ctx.strokeStyle = '#4A90D9';
    this.ctx.lineWidth = 3 * this.titleScale;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - lineWidth / 2, lineY);
    this.ctx.lineTo(centerX + lineWidth / 2, lineY);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  /**
   * 绘制健康游戏忠告
   */
  _drawHealthTips() {
    const centerX = this.width / 2;
    const lineHeight = 36;
    const startY = this.tipY - (this.healthTips.length * lineHeight) / 2;
    
    this.ctx.save();
    this.ctx.font = '22px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    for (let i = 0; i < this.healthTips.length; i++) {
      this.ctx.save();
      this.ctx.globalAlpha = this.tipOpacities[i] * this.opacity;
      this.ctx.fillStyle = '#888888';
      this.ctx.fillText(this.healthTips[i], centerX, startY + i * lineHeight);
      this.ctx.restore();
    }
    
    this.ctx.restore();
  }
}

export default StartScene;
