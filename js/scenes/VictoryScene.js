/**
 * 胜利场景
 * 展示礼花动画、星级评价和游戏数据
 */

import { BaseScene } from './BaseScene.js';
import { Button } from '../ui/Button.js';
import { Tween, Easing, delay } from '../utils/Tween.js';
import { globalEvent } from '../utils/EventEmitter.js';
import { audioManager, SoundType } from '../audio/AudioManager.js';

export class VictoryScene extends BaseScene {
  constructor(canvas, ctx) {
    super(canvas, ctx);
    
    // 游戏数据
    this.gameData = null;
    
    // UI元素
    this.backButton = null;
    
    // 动画状态
    this.titleOpacity = 0;
    this.titleScale = 0.8;
    this.contentOpacity = 0;
    this.contentY = 30;
    
    // 礼花粒子
    this.particles = [];
    this.animationId = null;
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
    
    if (this.backButton) {
      this.backButton.setPosition(this.width / 2, this.height * 0.85);
    }
  }
  
  /**
   * 创建返回按钮
   */
  _createButton() {
    this.backButton = new Button({
      text: '返回主页',
      width: 200,
      height: 60,
      fontSize: 28,
      // 使用金色主题匹配胜利氛围
      bgColor: '#D4A84B',
      bgColorHover: '#E5B95C',
      bgColorActive: '#C3983A',
      textColor: '#FFFFFF',
      borderRadius: 12,
      onClick: () => {
        this._onBackClick();
      }
    });
    
    this.uiElements.push(this.backButton);
  }
  
  /**
   * 返回按钮点击
   */
  _onBackClick() {
    globalEvent.emit('scene:change', 'mode');
  }
  
  /**
   * 进入动画
   */
  async enter(data) {
    // 保存游戏数据
    this.gameData = data;
    
    // 重置动画状态
    this.titleOpacity = 0;
    this.titleScale = 0.8;
    // 让内容立即显示，不等待动画
    this.contentOpacity = 1;
    this.contentY = 0;
    
    // 初始化礼花粒子
    this._initParticles();
    
    // 播放胜利音效
    audioManager.play(SoundType.WIN);
    
    await super.enter();
    
    // 标题动画
    new Tween(this)
      .to({ titleOpacity: 1, titleScale: 1 }, 500)
      .easing(Easing.easeOutBack)
      .start();
    
    // 内容立即显示，不需要动画
    
    // 按钮入场
    this.backButton.playEnterAnimation(400);
    
    // 开始礼花动画（只播放一次）
    this._playFireworksOnce();
  }
  
  /**
   * 离开动画
   */
  async exit() {
    // 停止胜利音效
    audioManager.stop(SoundType.WIN);
    
    this._stopParticleAnimation();
    
    new Tween(this)
      .to({ titleOpacity: 0, contentOpacity: 0 }, 250)
      .easing(Easing.easeInQuad)
      .start();
    
    await this.backButton.playExitAnimation();
    await super.exit();
  }
  
  /**
   * 初始化礼花粒子
   */
  _initParticles() {
    this.particles = [];
    const centerX = this.width / 2;
    const centerY = this.height * 0.35;
    
    // 创建多组礼花，从不同位置发射
    const burstPositions = [
      { x: centerX, y: centerY - 50 },
      { x: centerX - 120, y: centerY + 20 },
      { x: centerX + 120, y: centerY + 20 },
      { x: centerX - 60, y: centerY - 30 },
      { x: centerX + 60, y: centerY - 30 }
    ];
    
    burstPositions.forEach((pos, burstIndex) => {
      const particleCount = 12 + Math.random() * 8;
      const baseHue = burstIndex * 60;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
        // 速度放慢30% (原速度 * 0.7)
        const speed = (3 + Math.random() * 4) * 0.7;
        const hue = baseHue + Math.random() * 40;
        
        this.particles.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          color: `hsl(${hue}, 80%, 60%)`,
          alpha: 1,
          // 衰减放慢30%，让粒子存在更久
          decay: (0.008 + Math.random() * 0.008) * 0.7,
          gravity: 0.15 * 0.7, // 重力也放慢
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2 * 0.7, // 旋转速度放慢
          shape: Math.random() > 0.5 ? 'circle' : 'star'
        });
      }
    });
  }
  
  /**
   * 播放一次礼花动画（不循环）
   */
  _playFireworksOnce() {
    let frameCount = 0;
    const maxFrames = 300; // 约5秒
    
    const animate = () => {
      if (!this.visible) return;
      
      // 更新粒子
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
      });
      
      // 移除消失的粒子
      this.particles = this.particles.filter(p => p.alpha > 0);
      
      frameCount++;
      
      // 继续动画直到所有粒子消失或达到最大帧数
      if (this.particles.length > 0 && frameCount < maxFrames) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  /**
   * 停止粒子动画
   */
  _stopParticleAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * 更新
   */
  update(deltaTime) {
    // 更新粒子
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= p.decay;
      p.rotation += p.rotationSpeed;
    });
    
    this.particles = this.particles.filter(p => p.alpha > 0);
  }
  
  /**
   * 绘制背景
   */
  _drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    // 深色渐变背景
    const gradient = ctx.createRadialGradient(
      w / 2, h / 2, 0,
      w / 2, h / 2, Math.max(w, h) / 2
    );
    gradient.addColorStop(0, '#2A3A4A');
    gradient.addColorStop(0.7, '#1A2A3A');
    gradient.addColorStop(1, '#0F1A25');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
  
  /**
   * 绘制礼花粒子
   */
  _drawParticles() {
    const ctx = this.ctx;
    
    ctx.save();
    
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      
      if (p.shape === 'circle') {
        // 圆形粒子
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 星形粒子
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const outerX = Math.cos(angle) * p.size;
          const outerY = Math.sin(angle) * p.size;
          const innerAngle = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
          const innerX = Math.cos(innerAngle) * p.size * 0.4;
          const innerY = Math.sin(innerAngle) * p.size * 0.4;
          
          if (i === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    });
    
    ctx.restore();
  }
  
  /**
   * 绘制内容
   */
  _drawContent() {
    this._drawParticles();
    this._drawTitle();
    this._drawCrowns();
    this._drawGameInfo();
  }
  
  /**
   * 绘制标题
   */
  _drawTitle() {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const titleY = this.height * 0.15;
    
    ctx.save();
    ctx.globalAlpha = this.titleOpacity * this.opacity;
    
    // 标题阴影
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 20 * this.titleScale;
    
    // 标题文字
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${56 * this.titleScale}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉 恭喜通关 🎉', centerX, titleY);
    
    ctx.restore();
  }
  
  /**
   * 绘制皇冠评价
   */
  _drawCrowns() {
    if (!this.gameData) return;
    
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const crownsY = this.height * 0.38 + this.contentY;
    const crownSize = 50;
    const crownSpacing = 70;
    
    const totalWidth = crownSpacing * 2 + crownSize;
    const startX = centerX - totalWidth / 2 + crownSize / 2;
    
    ctx.save();
    ctx.globalAlpha = this.contentOpacity * this.opacity;
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * crownSpacing;
      const isActive = i < this.gameData.stars;
      
      // 添加脉冲动画效果
      let pulseScale = 1;
      if (isActive) {
        const time = Date.now() / 1000;
        pulseScale = 1 + Math.sin(time * 3 + i * 0.5) * 0.05;
      }
      
      this._drawCrown(ctx, x, crownsY, crownSize * pulseScale, isActive);
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制圆角矩形（兼容小程序Canvas）
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
   * 绘制单个皇冠
   */
  _drawCrown(ctx, cx, cy, size, isActive) {
    ctx.save();
    ctx.translate(cx, cy);
    const scale = size / 40;
    ctx.scale(scale, scale);
    
    if (isActive) {
      // 亮黄色皇冠
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
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
      ctx.fillStyle = '#555';
      ctx.strokeStyle = '#444';
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
    }
    
    ctx.restore();
  }
  
  /**
   * 绘制游戏信息
   */
  _drawGameInfo() {
    if (!this.gameData) return;
    
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const infoY = this.height * 0.55 + this.contentY;
    
    ctx.save();
    ctx.globalAlpha = this.contentOpacity * this.opacity;
    
    // 信息卡片背景
    const cardWidth = 280;
    const cardHeight = 120;
    const cardX = centerX - cardWidth / 2;
    const cardY = infoY;
    
    // 卡片阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // 卡片背景 - 手动绘制圆角矩形
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    this._drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowColor = 'transparent';
    
    // 模式信息
    ctx.fillStyle = '#AAA';
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${this.gameData.boardSize}×${this.gameData.boardSize} 模式`, centerX, cardY + 15);
    
    // 时间和步数
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ${this.gameData.time}`, cardX + 30, cardY + 55);
    
    ctx.textAlign = 'right';
    ctx.fillText(`步数: ${this.gameData.moves}`, cardX + cardWidth - 30, cardY + 55);
    
    // 评价文字
    let ratingText = '';
    switch (this.gameData.stars) {
      case 3: ratingText = '太棒了！完美！'; break;
      case 2: ratingText = '很好！继续加油！'; break;
      case 1: ratingText = '不错！还可以更快！'; break;
      default: ratingText = '继续加油！'; break;
    }
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ratingText, centerX, cardY + 90);
    
    ctx.restore();
  }
  
  /**
   * 销毁
   */
  destroy() {
    this._stopParticleAnimation();
    super.destroy();
  }
}

export default VictoryScene;
