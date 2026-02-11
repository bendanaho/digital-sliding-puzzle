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
    
    // 播放胜利音效
    audioManager.play(SoundType.WIN);
    
    // 更新弹窗内容
    const timeStr = this.timer.getFormattedTime();
    const moves = this.board.getMoveCount();
    this.winDialog.content = `用时: ${timeStr}\n步数: ${moves}`;
    
    // 延迟显示弹窗
    setTimeout(() => {
      this.winDialog.show();
    }, 300);
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
    this._drawGameInfo();
    
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
