/**
 * 音效管理器
 * 统一管理游戏音效的播放
 * 使用 wx.createInnerAudioContext() 避免重复创建实例
 * 支持无资源时的安全降级
 */

import { assetManager } from '../assets/AssetManager.js';

// 音效类型枚举
export const SoundType = {
  BUTTON_CLICK: 'button_click',
  BLOCK_MOVE: 'block_move',
  WIN: 'win'
};

export class AudioManager {
  constructor() {
    // 音频实例缓存
    this.audioInstances = new Map();
    
    // 全局设置
    this.enabled = true;
    this.masterVolume = 1.0;
    
    // 音效配置
    this.soundConfig = {
      [SoundType.BUTTON_CLICK]: { volume: 1.0, loop: false },
      [SoundType.BLOCK_MOVE]: { volume: 0.8, loop: false },
      [SoundType.WIN]: { volume: 1.0, loop: false }
    };

    // 标记是否有真实音频资源
    this.hasRealAudio = false;
  }

  /**
   * 初始化音频管理器
   */
  init() {
    console.log('[AudioManager] 初始化音频管理器');
    
    // 检查是否有配置的音频资源
    for (let soundType of Object.values(SoundType)) {
      if (assetManager.hasAudio(soundType)) {
        this.hasRealAudio = true;
        break;
      }
    }

    if (!this.hasRealAudio) {
      console.log('[AudioManager] 无真实音频资源，使用安全降级模式');
    }
  }

  /**
   * 预加载音效实例
   * 在游戏开始前调用，避免首次播放时的延迟
   */
  preloadSounds() {
    if (!this.hasRealAudio) return;

    for (let soundType of Object.values(SoundType)) {
      this.getOrCreateAudio(soundType);
    }
  }

  /**
   * 获取或创建音频实例
   * @param {string} soundType - 音效类型
   * @returns {InnerAudioContext|null}
   */
  getOrCreateAudio(soundType) {
    if (this.audioInstances.has(soundType)) {
      return this.audioInstances.get(soundType);
    }

    const audioPath = assetManager.getAudioPath(soundType);
    if (!audioPath) {
      return null;
    }

    try {
      const audio = wx.createInnerAudioContext();
      audio.src = audioPath;
      
      const config = this.soundConfig[soundType] || {};
      audio.volume = (config.volume || 1.0) * this.masterVolume;
      audio.loop = config.loop || false;

      // 错误处理
      audio.onError((err) => {
        console.error(`[AudioManager] 音频播放错误 [${soundType}]:`, err);
      });

      this.audioInstances.set(soundType, audio);
      return audio;
    } catch (e) {
      console.error(`[AudioManager] 创建音频实例失败 [${soundType}]:`, e);
      return null;
    }
  }

  /**
   * 播放音效
   * @param {string} soundType - 音效类型
   * @param {Object} options - 可选参数 { volume, loop }
   */
  play(soundType, options = {}) {
    // 如果音效被禁用，直接返回
    if (!this.enabled) {
      console.log(`[AudioManager] 音效已禁用，跳过播放: ${soundType}`);
      return;
    }

    // 安全降级：如果没有真实资源，只打印日志
    if (!this.hasRealAudio) {
      console.log(`[AudioManager] 播放音效(模拟): ${soundType}`);
      return;
    }

    const audio = this.getOrCreateAudio(soundType);
    if (!audio) {
      console.warn(`[AudioManager] 未找到音效资源: ${soundType}`);
      return;
    }

    try {
      // 应用选项
      if (options.volume !== undefined) {
        audio.volume = options.volume * this.masterVolume;
      }
      if (options.loop !== undefined) {
        audio.loop = options.loop;
      }

      // 重置播放位置并播放
      audio.seek(0);
      audio.play();
      
      console.log(`[AudioManager] 播放音效: ${soundType}`);
    } catch (e) {
      console.error(`[AudioManager] 播放失败 [${soundType}]:`, e);
    }
  }

  /**
   * 停止音效
   * @param {string} soundType - 音效类型
   */
  stop(soundType) {
    const audio = this.audioInstances.get(soundType);
    if (audio) {
      try {
        audio.stop();
      } catch (e) {
        console.error(`[AudioManager] 停止失败 [${soundType}]:`, e);
      }
    }
  }

  /**
   * 暂停音效
   * @param {string} soundType - 音效类型
   */
  pause(soundType) {
    const audio = this.audioInstances.get(soundType);
    if (audio) {
      try {
        audio.pause();
      } catch (e) {
        console.error(`[AudioManager] 暂停失败 [${soundType}]:`, e);
      }
    }
  }

  /**
   * 停止所有音效
   */
  stopAll() {
    for (let [soundType, audio] of this.audioInstances) {
      try {
        audio.stop();
      } catch (e) {
        console.error(`[AudioManager] 停止失败 [${soundType}]:`, e);
      }
    }
  }

  /**
   * 暂停所有音效
   */
  pauseAll() {
    for (let audio of this.audioInstances.values()) {
      try {
        audio.pause();
      } catch (e) {
        console.error('[AudioManager] 暂停失败:', e);
      }
    }
  }

  /**
   * 设置音效开关
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[AudioManager] 音效开关: ${enabled ? '开启' : '关闭'}`);
    
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * 获取音效开关状态
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * 切换音效开关
   * @returns {boolean} 切换后的状态
   */
  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * 设置主音量
   * @param {number} volume - 0.0 ~ 1.0
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // 更新所有实例的音量
    for (let [soundType, audio] of this.audioInstances) {
      const config = this.soundConfig[soundType] || {};
      audio.volume = (config.volume || 1.0) * this.masterVolume;
    }
  }

  /**
   * 设置单个音效的音量
   * @param {string} soundType - 音效类型
   * @param {number} volume - 0.0 ~ 1.0
   */
  setSoundVolume(soundType, volume) {
    if (!this.soundConfig[soundType]) {
      this.soundConfig[soundType] = {};
    }
    this.soundConfig[soundType].volume = Math.max(0, Math.min(1, volume));
    
    const audio = this.audioInstances.get(soundType);
    if (audio) {
      audio.volume = this.soundConfig[soundType].volume * this.masterVolume;
    }
  }

  /**
   * 销毁所有音频实例
   * 游戏退出时调用
   */
  destroy() {
    for (let [soundType, audio] of this.audioInstances) {
      try {
        audio.stop();
        audio.destroy();
      } catch (e) {
        console.error(`[AudioManager] 销毁失败 [${soundType}]:`, e);
      }
    }
    this.audioInstances.clear();
    console.log('[AudioManager] 音频管理器已销毁');
  }
}

// 单例实例
export const audioManager = new AudioManager();
export default audioManager;
