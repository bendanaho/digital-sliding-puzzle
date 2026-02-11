/**
 * 数字游走 - 主入口
 * 微信小游戏《数字华容道》
 */

import { assetManager } from './js/assets/AssetManager.js';
import { audioManager } from './js/audio/AudioManager.js';
import { globalEvent } from './js/utils/EventEmitter.js';
import { StartScene } from './js/scenes/StartScene.js';
import { ModeScene } from './js/scenes/ModeScene.js';
import { GameScene } from './js/scenes/GameScene.js';

// 游戏主类
class Game {
  constructor() {
    // Canvas 上下文
    this.canvas = null;
    this.ctx = null;
    
    // 屏幕信息
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.pixelRatio = 1;
    
    // 场景管理
    this.scenes = {};
    this.currentScene = null;
    this.currentSceneName = '';
    
    // 游戏循环
    this.isRunning = false;
    this.lastFrameTime = 0;
    
    // 触摸状态
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.init();
  }

  /**
   * 初始化游戏
   */
  async init() {
    console.log('[Game] 初始化游戏...');
    
    // 获取系统信息
    this._initSystemInfo();
    
    // 初始化 Canvas
    this._initCanvas();
    
    // 初始化资源管理器
    await assetManager.init();
    
    // 初始化音效管理器
    audioManager.init();
    
    // 初始化场景
    this._initScenes();
    
    // 注册全局事件
    this._registerEvents();
    
    // 注册触摸事件
    this._registerTouchEvents();
    
    // 启动游戏循环
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this._gameLoop();
    
    // 进入开始场景
    this.switchScene('start');
    
    console.log('[Game] 游戏初始化完成');
  }

  /**
   * 获取系统信息
   */
  _initSystemInfo() {
    const sysInfo = wx.getSystemInfoSync();
    this.screenWidth = sysInfo.screenWidth;
    this.screenHeight = sysInfo.screenHeight;
    this.pixelRatio = sysInfo.pixelRatio;
    
    console.log('[Game] 系统信息:', {
      width: this.screenWidth,
      height: this.screenHeight,
      pixelRatio: this.pixelRatio
    });
  }

  /**
   * 初始化 Canvas
   */
  _initCanvas() {
    // 获取主 Canvas
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    // 设置 Canvas 大小（考虑设备像素比）
    this.canvas.width = this.screenWidth * this.pixelRatio;
    this.canvas.height = this.screenHeight * this.pixelRatio;
    
    // 缩放上下文以匹配像素比
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    // 逻辑尺寸
    this.width = this.screenWidth;
    this.height = this.screenHeight;
    
    console.log('[Game] Canvas 初始化:', {
      width: this.canvas.width,
      height: this.canvas.height,
      logicWidth: this.width,
      logicHeight: this.height
    });
  }

  /**
   * 初始化场景
   */
  _initScenes() {
    this.scenes = {
      start: new StartScene(this.canvas, this.ctx),
      mode: new ModeScene(this.canvas, this.ctx),
      game: new GameScene(this.canvas, this.ctx)
    };
    
    // 初始化所有场景
    for (let name in this.scenes) {
      this.scenes[name].init();
    }
    
    console.log('[Game] 场景初始化完成');
  }

  /**
   * 注册全局事件
   */
  _registerEvents() {
    // 场景切换事件
    globalEvent.on('scene:change', (sceneName) => {
      this.switchScene(sceneName);
    });
    
    // 游戏开始事件
    globalEvent.on('game:start', (boardSize) => {
      this.switchScene('game', boardSize);
    });
    
    // 监听屏幕旋转/尺寸变化
    wx.onWindowResize?.((res) => {
      this._onResize(res);
    });
  }

  /**
   * 注册触摸事件
   */
  _registerTouchEvents() {
    wx.onTouchStart((res) => {
      const touch = res.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      
      if (this.currentScene) {
        this.currentScene.onTouchStart(this.touchStartX, this.touchStartY);
      }
    });
    
    wx.onTouchMove((res) => {
      const touch = res.touches[0];
      
      if (this.currentScene) {
        this.currentScene.onTouchMove(touch.clientX, touch.clientY);
      }
    });
    
    wx.onTouchEnd((res) => {
      // 获取变化的触摸点
      const touch = res.changedTouches[0] || res.touches[0];
      if (!touch) return;
      
      if (this.currentScene) {
        this.currentScene.onTouchEnd(touch.clientX, touch.clientY);
      }
    });
    
    wx.onTouchCancel((res) => {
      const touch = res.changedTouches[0] || res.touches[0];
      if (!touch) return;
      
      if (this.currentScene) {
        this.currentScene.onTouchEnd(touch.clientX, touch.clientY);
      }
    });
  }

  /**
   * 切换场景
   */
  async switchScene(sceneName, ...args) {
    if (!this.scenes[sceneName]) {
      console.error('[Game] 场景不存在:', sceneName);
      return;
    }
    
    console.log('[Game] 切换场景:', sceneName);
    
    // 退出当前场景
    if (this.currentScene) {
      await this.currentScene.exit();
    }
    
    // 切换到新场景
    this.currentSceneName = sceneName;
    this.currentScene = this.scenes[sceneName];
    
    // 如果是游戏场景，设置待处理的棋盘大小
    if (sceneName === 'game' && args[0]) {
      this.currentScene.pendingBoardSize = args[0];
      this.currentScene.isLoading = true;
    }
    
    // 进入场景
    await this.currentScene.enter();
  }

  /**
   * 屏幕尺寸变化处理
   */
  _onResize(res) {
    console.log('[Game] 屏幕尺寸变化:', res);
    
    // 更新系统信息
    this.screenWidth = res.windowWidth;
    this.screenHeight = res.windowHeight;
    
    // 更新 Canvas 大小
    this.canvas.width = this.screenWidth * this.pixelRatio;
    this.canvas.height = this.screenHeight * this.pixelRatio;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    this.width = this.screenWidth;
    this.height = this.screenHeight;
    
    // 更新所有场景布局
    for (let name in this.scenes) {
      this.scenes[name].updateLayout();
    }
  }

  /**
   * 游戏主循环
   */
  _gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // 更新
    this._update(deltaTime);
    
    // 渲染
    this._render();
    
    // 请求下一帧（使用 setTimeout 实现约 60fps）
    setTimeout(() => this._gameLoop(), 16);
  }

  /**
   * 更新逻辑
   */
  _update(deltaTime) {
    // 当前场景的更新
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * 渲染
   */
  _render() {
    // 清空画布（使用逻辑尺寸）
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 渲染当前场景
    if (this.currentScene) {
      this.currentScene.draw();
    } else {
      // 没有场景时显示加载中
      this.ctx.fillStyle = '#333';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('加载中...', this.width / 2, this.height / 2);
    }
  }

  /**
   * 销毁游戏
   */
  destroy() {
    this.isRunning = false;
    
    // 销毁所有场景
    for (let name in this.scenes) {
      this.scenes[name].destroy();
    }
    
    // 销毁音效管理器
    audioManager.destroy();
    
    console.log('[Game] 游戏已销毁');
  }
}

// 启动游戏
const game = new Game();

// 监听游戏隐藏/显示
wx.onHide(() => {
  console.log('[Game] 游戏进入后台');
});

wx.onShow(() => {
  console.log('[Game] 游戏回到前台');
});

// 导出（便于调试）
export default game;
