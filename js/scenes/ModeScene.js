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
   * 绘制背景
   */
  _drawBackground() {
    // 渐变背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#F8FAFC');
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, '#F0F4F8');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
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
