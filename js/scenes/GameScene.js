/**
 * 游戏页面场景
 * 核心游戏逻辑：棋盘、计时、步数、胜利判定
 */

import { BaseScene } from './BaseScene.js';
import { Board } from '../core/Board.js';
import { Timer } from '../core/Timer.js';
import { BackButton } from '../ui/BackButton.js';
import { Dialog } from '../ui/Dialog.js';
import { Tween, Easing } from '../utils/Tween.js';
import { globalEvent } from '../utils/EventEmitter.js';
import { audioManager, SoundType } from '../audio/AudioManager.js';

export class GameScene extends BaseScene {
  constructor(canvas, ctx) {
    super(canvas, ctx);
    
    // 游戏状态
    this.boardSize = 4;
    this.board = null;
    this.timer = new Timer();
    this.hasStarted = false;
    this.isGameOver = false;
    this.isLoading = true;
    this.pendingBoardSize = null;
    
    // UI元素
    this.backButton = null;
    this.winDialog = null;
    
    // 布局参数
    this.boardX = 0;
    this.boardY = 0;
    this.blockSize = 80;
    this.blockGap = 10;
    
    // 动画状态
    this.uiOpacity = 0;
    this.infoY = 0;
  }

  /**
   * 初始化
   */
  init() {
    this._createUI();
    this.updateLayout();
  }

  /**
   * 更新布局
   */
  updateLayout() {
    super.updateLayout();
    
    const screenWidth = this.width;
    const screenHeight = this.height;
    
    // 计算棋盘大小（适配屏幕）
    const maxBoardWidth = screenWidth - 60;
    const maxBoardHeight = screenHeight - 200;
    const maxBoardSize = Math.min(maxBoardWidth, maxBoardHeight);
    
    // 计算方块大小
    this.blockSize = Math.floor((maxBoardSize - (this.boardSize - 1) * this.blockGap) / this.boardSize);
    
    // 计算棋盘位置（居中）
    const boardWidth = this.boardSize * this.blockSize + (this.boardSize - 1) * this.blockGap;
    const boardHeight = boardWidth;
    this.boardX = (screenWidth - boardWidth) / 2;
    this.boardY = (screenHeight - boardHeight) / 2 + 20;
    
    // 更新返回按钮位置
    if (this.backButton) {
      this.backButton.setPosition(45, 45);
    }
    
    // 更新棋盘位置
    if (this.board) {
      this.board.updatePosition(this.boardX, this.boardY);
    }
    
    // 更新胜利弹窗位置
    if (this.winDialog) {
      this.winDialog.x = screenWidth / 2;
      this.winDialog.y = screenHeight / 2;
      this.winDialog._layoutButtons();
    }
  }

  /**
   * 创建UI
   */
  _createUI() {
    // 返回按钮
    this.backButton = new BackButton({
      onClick: () => {
        this._onBackClick();
      }
    });
    
    // 胜利弹窗
    this.winDialog = new Dialog({
      width: 400,
      height: 280,
      title: '恭喜通关！',
      content: '',
      overlayColor: 'rgba(0, 0, 0, 0.6)'
    });
    
    this.winDialog.addConfirmButton('确认', () => {
      this._onWinConfirm();
    });
    
    this.uiElements.push(this.backButton, this.winDialog);
  }

  /**
   * 开始游戏
   */
  async startGame(size) {
    // 立即设置加载状态并清除旧棋盘，防止显示旧棋盘
    this.isLoading = true;
    
    // 销毁旧棋盘并立即清除引用，防止绘制
    if (this.board) {
      this.board.destroy();
      this.board = null;
    }
    
    this.boardSize = size;
    this.hasStarted = false;
    this.isGameOver = false;
    this.timer.reset();
    
    // 更新布局以适配新模式
    this.updateLayout();
    
    // 创建新棋盘
    this.board = new Board(this.boardSize, {
      x: this.boardX,
      y: this.boardY,
      blockSize: this.blockSize,
      blockGap: this.blockGap
    });
    
    // 先打乱棋盘（在显示前完成）
    try {
      await this.board.shuffle();
    } catch (e) {
      console.error('[GameScene] 打乱棋盘失败:', e);
    }
    
    // 显示棋盘（已经是打乱状态）
    this.isLoading = false;
    
    // 入场动画
    if (this.board) {
      this.board.playEnterAnimation();
    }
  }

  /**
   * 返回按钮点击
   */
  _onBackClick() {
    this.timer.stop();
    globalEvent.emit('scene:change', 'mode');
  }

  /**
   * 胜利确认
   */
  _onWinConfirm() {
    globalEvent.emit('scene:change', 'mode');
  }

  /**
   * 处理触摸开始
   */
  onTouchStart(x, y) {
    // 优先处理弹窗
    if (this.winDialog.visible) {
      return this.winDialog.onTouchStart(x, y);
    }
    
    // 处理返回按钮
    if (this.backButton.onTouchStart(x, y)) {
      return true;
    }
    
    return false;
  }

  /**
   * 处理触摸结束
   */
  onTouchEnd(x, y) {
    // 优先处理弹窗
    if (this.winDialog.visible) {
      return this.winDialog.onTouchEnd(x, y);
    }
    
    // 处理返回按钮
    if (this.backButton.onTouchEnd(x, y)) {
      return true;
    }
    
    // 游戏结束不再响应
    if (this.isGameOver) return false;
    
    // 处理棋盘点击
    if (this.board && this.board.contains(x, y)) {
      this._handleBoardClick(x, y);
      return true;
    }
    
    return false;
  }

  /**
   * 处理棋盘点击
   */
  async _handleBoardClick(x, y) {
    if (!this.hasStarted) {
      // 第一次移动开始计时
      this.hasStarted = true;
      this.timer.start();
    }
    
    const moved = await this.board.moveAtPosition(x, y, true);
    
    if (moved) {
      // 检查胜利
      if (this.board.checkWin()) {
        this._onWin();
      }
    }
  }

  /**
   * 胜利处理
   */
  async _onWin() {
    this.isGameOver = true;
    this.timer.stop();
    
    // 计算获得的星级
    const starCount = this._calculateStars();
    const timeStr = this.timer.getFormattedTime();
    const moves = this.board.getMoveCount();
    
    // 延迟跳转到胜利界面
    setTimeout(() => {
      globalEvent.emit('game:victory', {
        boardSize: this.boardSize,
        stars: starCount,
        time: timeStr,
        timeSeconds: Math.floor(this.timer.getTime() / 1000),
        moves: moves
      });
    }, 400);
  }

  /**
   * 进入动画
   */
  async enter() {
    this.uiOpacity = 0;
    this.infoY = 20;
    
    await super.enter();
    
    // UI入场动画
    new Tween(this)
      .to({ uiOpacity: 1, infoY: 0 }, 300)
      .easing(Easing.easeOutQuad)
      .start();
    
    // 按钮入场
    this.backButton.playEnterAnimation();
    
    // 如果有待处理的棋盘大小，开始游戏
    if (this.pendingBoardSize) {
      const size = this.pendingBoardSize;
      this.pendingBoardSize = null;
      // 延迟一帧确保场景已渲染
      setTimeout(() => {
        this.startGame(size).catch(err => {
          console.error('[GameScene] startGame 失败:', err);
          this.isLoading = false;
        });
      }, 50);
    }
  }

  /**
   * 离开动画
   */
  async exit() {
    this.timer.stop();
    this.isLoading = true;
    
    // 隐藏弹窗
    if (this.winDialog.visible) {
      await this.winDialog.hide();
    }
    
    // 销毁棋盘，清空引用，避免下次进入时显示旧棋盘
    if (this.board) {
      this.board.destroy();
      this.board = null;
    }
    
    new Tween(this)
      .to({ uiOpacity: 0 }, 200)
      .easing(Easing.easeInQuad)
      .start();
    
    await this.backButton.playExitAnimation();
    await super.exit();
  }

  /**
   * 绘制背景 - 明亮柔和的同心圆背景
   */
  _drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    // 1. 底层背景 - 明亮的浅蓝白
    ctx.fillStyle = '#F5F9FC';
    ctx.fillRect(0, 0, w, h);
    
    // 2. 计算圆环参数
    // 中心亮区（棋盘区域）- 较大以确保棋盘周围明亮
    const centerRadius = 180;
    // 向外扩展的圆环间距
    const ringSpacing = 85;
    const ringCount = 3;
    
    // 3. 颜色配置 - 更明亮的色调
    const ringColors = [
      { r: 200, g: 230, b: 255 },  // 中心：极浅的亮蓝
      { r: 185, g: 235, b: 225 },  // 青绿
      { r: 220, g: 215, b: 250 },  // 淡紫
      { r: 195, g: 225, b: 240 }   // 天蓝
    ];
    
    // 4. 绘制中心亮区（棋盘周围）- 使用明亮的颜色
    const centerColor = ringColors[0];
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerRadius
    );
    // 中心最亮，向外渐变
    centerGradient.addColorStop(0, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.90)`);
    centerGradient.addColorStop(0.6, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.75)`);
    centerGradient.addColorStop(0.9, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.50)`);
    centerGradient.addColorStop(1, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.25)`);
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 5. 绘制外层圆环（带柔和过渡）
    for (let i = 0; i < ringCount; i++) {
      const innerRadius = centerRadius + i * ringSpacing;
      const outerRadius = innerRadius + ringSpacing;
      const color = ringColors[(i + 1) % ringColors.length];
      
      // 创建柔和的径向渐变
      const ringGradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius - 25,
        centerX, centerY, outerRadius + 25
      );
      
      // 内边缘柔和过渡
      ringGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      ringGradient.addColorStop(0.12, `rgba(${color.r}, ${color.g}, ${color.b}, 0.20)`);
      ringGradient.addColorStop(0.25, `rgba(${color.r}, ${color.g}, ${color.b}, 0.60)`);
      
      // 实体色区
      ringGradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, 0.70)`);
      ringGradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, 0.70)`);
      
      // 外边缘柔和过渡
      ringGradient.addColorStop(0.75, `rgba(${color.r}, ${color.g}, ${color.b}, 0.60)`);
      ringGradient.addColorStop(0.88, `rgba(${color.r}, ${color.g}, ${color.b}, 0.20)`);
      ringGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      
      ctx.fillStyle = ringGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 6. 最外层柔和淡入背景
    const outerFadeRadius = centerRadius + ringCount * ringSpacing + 30;
    const fadeGradient = ctx.createRadialGradient(
      centerX, centerY, outerFadeRadius - 50,
      centerX, centerY, outerFadeRadius + 50
    );
    fadeGradient.addColorStop(0, 'rgba(195, 225, 240, 0.35)');
    fadeGradient.addColorStop(0.5, 'rgba(210, 235, 245, 0.15)');
    fadeGradient.addColorStop(1, 'rgba(245, 249, 252, 0)');
    
    ctx.fillStyle = fadeGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerFadeRadius + 50, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 绘制内容
   */
  _drawContent() {
    this._drawGameInfo();
    this._drawCrowns();
    
    // 绘制棋盘（如果有的话）
    if (this.board) {
      this.board.draw(this.ctx);
    } else if (this.isLoading) {
      // 只有没有棋盘时才显示加载中
      this._drawLoading();
    }
  }

  /**
   * 绘制加载中提示
   */
  _drawLoading() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    this.ctx.save();
    this.ctx.fillStyle = '#666';
    this.ctx.font = '28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('加载中...', centerX, centerY);
    this.ctx.restore();
  }

  /**
   * 绘制游戏信息（时间和步数）
   */
  _drawGameInfo() {
    this.ctx.save();
    this.ctx.globalAlpha = this.uiOpacity * this.opacity;
    
    const timeStr = this.timer.getFormattedTime();
    const moves = this.board ? this.board.getMoveCount() : 0;
    
    // 信息区域背景
    const infoY = 100 + this.infoY;
    
    // 时间显示
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.font = 'bold 28px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`⏱ ${timeStr}`, 30, infoY);
    
    // 步数显示
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`步数: ${moves}`, this.width - 30, infoY);
    
    this.ctx.restore();
  }
  
  /**
   * 绘制皇冠评分（在棋盘上方）
   */
  _drawCrowns() {
    if (!this.board) return;
    
    const starCount = this._calculateStars();
    // 更大的皇冠，更靠上的位置
    const crownY = this.boardY - 70;
    const crownSize = 48;
    const crownSpacing = 56;
    const totalWidth = crownSpacing * 2 + crownSize;
    const startX = (this.width - totalWidth) / 2;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.uiOpacity * this.opacity;
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * crownSpacing;
      const isActive = i < starCount;
      this._drawCrown(x, crownY, crownSize, isActive);
    }
    
    this.ctx.restore();
  }
  
  /**
   * 绘制单个皇冠
   */
  _drawCrown(x, y, size, isActive) {
    const ctx = this.ctx;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const scale = size / 40;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    
    if (isActive) {
      // 亮黄色皇冠
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      
      // 皇冠主体
      ctx.beginPath();
      ctx.moveTo(-18, 5);
      ctx.lineTo(-12, -15);
      ctx.lineTo(-6, -5);
      ctx.lineTo(0, -18);
      ctx.lineTo(6, -5);
      ctx.lineTo(12, -15);
      ctx.lineTo(18, 5);
      ctx.quadraticCurveTo(18, 12, 12, 12);
      ctx.lineTo(-12, 12);
      ctx.quadraticCurveTo(-18, 12, -18, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 皇冠上的宝石
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(0, -18, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(-5, -2, 6, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 灰色未激活皇冠
      ctx.fillStyle = '#C0C0C0';
      ctx.strokeStyle = '#A0A0A0';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(-18, 5);
      ctx.lineTo(-12, -15);
      ctx.lineTo(-6, -5);
      ctx.lineTo(0, -18);
      ctx.lineTo(6, -5);
      ctx.lineTo(12, -15);
      ctx.lineTo(18, 5);
      ctx.quadraticCurveTo(18, 12, 12, 12);
      ctx.lineTo(-12, 12);
      ctx.quadraticCurveTo(-18, 12, -18, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * 计算当前星级
   */
  _calculateStars() {
    const elapsed = Math.floor(this.timer.getTime() / 1000);
    
    // 4x4 模式评分标准
    const timeLimits4x4 = [
      { stars: 3, maxTime: 60 },
      { stars: 2, maxTime: 180 },
      { stars: 1, maxTime: 300 }
    ];
    
    // 5x5 模式评分标准
    const timeLimits5x5 = [
      { stars: 3, maxTime: 150 },
      { stars: 2, maxTime: 360 },
      { stars: 1, maxTime: 720 }
    ];
    
    const limits = this.boardSize === 4 ? timeLimits4x4 : timeLimits5x5;
    
    for (const limit of limits) {
      if (elapsed <= limit.maxTime) {
        return limit.stars;
      }
    }
    
    return 0;
  }

  /**
   * 销毁
   */
  destroy() {
    this.timer.stop();
    if (this.board) {
      this.board.destroy();
    }
    super.destroy();
  }
}

export default GameScene;
