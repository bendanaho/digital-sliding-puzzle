/**
 * 模式选择页面场景
 * 选择 4×4 或 5×5 模式
 */

import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { BackButton } from '../ui/BackButton.js';
import { Tween, Easing } from '../utils/Tween.js';
import { globalEvent } from '../utils/EventEmitter.js';

export class ModeScene extends BaseScene {
  constructor(canvas, ctx) {
    super(canvas, ctx);
    
    // 标题
    this.title = '选择难度';
    this.titleOpacity = 0;
    
    // 按钮
    this.button4x4 = null;
    this.button5x5 = null;
    this.backButton = null;
    
    // 动画状态
    this.contentOpacity = 0;
    this.contentY = 0;
  }

  /**
   * 初始化
   */
  init() {
    this._createButtons();
    this.updateLayout();
  }

  /**
   * 更新布局
   */
  updateLayout() {
    super.updateLayout();
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // 模式按钮位置
    if (this.button4x4) {
      this.button4x4.setPosition(centerX, centerY - 60);
    }
    if (this.button5x5) {
      this.button5x5.setPosition(centerX, centerY + 60);
    }
    
    // 返回按钮位置（左上角）
    if (this.backButton) {
      this.backButton.setPosition(45, 45);
    }
  }

  /**
   * 创建按钮
   */
  _createButtons() {
    // 4×4 按钮
    this.button4x4 = new Button({
      text: '4 × 4',
      width: 200,
      height: 80,
      fontSize: 36,
      bgColor: '#4A90D9',
      bgColorHover: '#5AA0E9',
      bgColorActive: '#3A80C9',
      borderRadius: 16,
      onClick: () => {
        this._onModeSelected(4);
      }
    });
    
    // 5×5 按钮
    this.button5x5 = new Button({
      text: '5 × 5',
      width: 200,
      height: 80,
      fontSize: 36,
      bgColor: '#5AB9A8',
      bgColorHover: '#6AC9B8',
      bgColorActive: '#4AA998',
      borderRadius: 16,
      onClick: () => {
        this._onModeSelected(5);
      }
    });
    
    // 返回按钮
    this.backButton = new BackButton({
      onClick: () => {
        this._onBackClick();
      }
    });
    
    this.uiElements.push(this.button4x4, this.button5x5, this.backButton);
  }

  /**
   * 模式选择
   */
  _onModeSelected(size) {
    globalEvent.emit('game:start', size);
  }

  /**
   * 返回按钮点击
   */
  _onBackClick() {
    globalEvent.emit('scene:change', 'start');
  }

  /**
   * 进入动画
   */
  async enter() {
    this.titleOpacity = 0;
    this.contentOpacity = 0;
    this.contentY = 30;
    
    await super.enter();
    
    // 标题动画
    new Tween(this)
      .to({ titleOpacity: 1 }, 300)
      .easing(Easing.easeOutQuad)
      .start();
    
    // 内容动画
    new Tween(this)
      .to({ contentOpacity: 1, contentY: 0 }, 350)
      .easing(Easing.easeOutQuad)
      .start();
    
    // 按钮入场
    this.button4x4.playEnterAnimation(100);
    this.button5x5.playEnterAnimation(200);
    this.backButton.playEnterAnimation(50);
  }

  /**
   * 离开动画
   */
  async exit() {
    new Tween(this)
      .to({ titleOpacity: 0 }, 200)
      .easing(Easing.easeInQuad)
      .start();
    
    await Promise.all([
      this.button4x4.playExitAnimation(),
      this.button5x5.playExitAnimation(),
      this.backButton.playExitAnimation()
    ]);
    
    await super.exit();
  }

  /**
   * 绘制背景 - 柔和斜线渐变
   */
  _drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 1. 主背景 - 柔和的斜向渐变（从右上到左下，与开始界面对角方向相反）
    const mainGradient = ctx.createLinearGradient(w, 0, 0, h);
    mainGradient.addColorStop(0, '#E0F7F5');    // 柔和的薄荷绿
    mainGradient.addColorStop(0.35, '#F0FCFA'); // 浅绿白
    mainGradient.addColorStop(0.65, '#F5FAFF'); // 浅蓝白
    mainGradient.addColorStop(1, '#E8F4FD');    // 柔和的天蓝
    
    ctx.fillStyle = mainGradient;
    ctx.fillRect(0, 0, w, h);
    
    // 2. 装饰性斜线条纹 - 细腻的线条
    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = '#5AB9A8';
    ctx.lineWidth = 1;
    
    const lineSpacing = 55;
    const diagonalOffset = Math.max(w, h);
    
    // 从右上到左下的斜线
    ctx.beginPath();
    for (let i = -diagonalOffset; i < w + h + diagonalOffset; i += lineSpacing) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
    }
    ctx.stroke();
    
    // 3. 第二层斜线（交叉方向，更稀疏）
    ctx.globalAlpha = 0.02;
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    for (let i = -diagonalOffset; i < w + h + diagonalOffset; i += lineSpacing * 2.5) {
      ctx.moveTo(i, h);
      ctx.lineTo(i - h, 0);
    }
    ctx.stroke();
    ctx.restore();
    
    // 4. 顶部和底部的柔和光晕
    const topGlow = ctx.createLinearGradient(0, 0, 0, h * 0.35);
    topGlow.addColorStop(0, 'rgba(90, 185, 168, 0.12)');
    topGlow.addColorStop(1, 'rgba(90, 185, 168, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, h * 0.35);
    
    const bottomGlow = ctx.createLinearGradient(0, h * 0.65, 0, h);
    bottomGlow.addColorStop(0, 'rgba(74, 144, 217, 0)');
    bottomGlow.addColorStop(1, 'rgba(74, 144, 217, 0.1)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);
    
    // 5. 角落装饰光点
    this._drawCornerGlow(w * 0.12, h * 0.18, 110, 'rgba(90, 185, 168, 0.1)');
    this._drawCornerGlow(w * 0.88, h * 0.82, 90, 'rgba(74, 144, 217, 0.1)');
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
  }

  /**
   * 绘制标题
   */
  _drawTitle() {
    const centerX = this.width / 2;
    const titleY = this.height * 0.2;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.titleOpacity * this.opacity;
    
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.font = 'bold 40px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.title, centerX, titleY);
    
    this.ctx.restore();
  }
}

export default ModeScene;
