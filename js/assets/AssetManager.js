/**
 * 资源管理器
 * 统一管理图片、音频等资源的加载和缓存
 * 预留了未来替换真实图片资源的接口
 */

export class AssetManager {
  constructor() {
    // 资源缓存
    this.images = new Map();
    this.audios = new Map();
    
    // 加载状态
    this.loaded = false;
    this.loadProgress = 0;
    this.totalAssets = 0;
    this.loadedAssets = 0;
    
    // 资源路径配置（后续可替换为真实资源）
    this.config = {
      // 图片资源占位 - 未来替换为真实图片路径
      images: {
        // 'button_bg': 'images/button.png',
        // 'block_bg': 'images/block.png',
        // 'empty_block': 'images/empty.png',
        // 'back_icon': 'images/back.png',
        // 'logo': 'images/logo.png'
      },
      // 音频资源占位
      audios: {
        'button_click': 'js/audio/click.mp3',
        // 'block_move': 'js/audio/move.mp3',
        // 'win': 'js/audio/win.mp3'
      }
    };
  }

  /**
   * 初始化资源管理器
   */
  async init() {
    console.log('[AssetManager] 初始化资源管理器');
    // 加载所有配置的资源
    await this.loadAll();
    return Promise.resolve();
  }

  /**
   * 加载所有配置的资源
   */
  async loadAll() {
    console.log('[AssetManager] 开始加载资源');
    
    const imagePromises = [];
    const audioPromises = [];

    // 加载图片
    for (let [key, path] of Object.entries(this.config.images)) {
      imagePromises.push(this.loadImage(key, path));
    }

    // 加载音频
    for (let [key, path] of Object.entries(this.config.audios)) {
      audioPromises.push(this.loadAudio(key, path));
    }

    this.totalAssets = imagePromises.length + audioPromises.length;
    
    if (this.totalAssets === 0) {
      console.log('[AssetManager] 没有配置资源需要加载');
      this.loaded = true;
      this.loadProgress = 100;
      return;
    }

    await Promise.all([...imagePromises, ...audioPromises]);
    this.loaded = true;
    console.log('[AssetManager] 所有资源加载完成');
  }

  /**
   * 加载单张图片
   * @param {string} key - 资源标识
   * @param {string} src - 图片路径
   * @returns {Promise<Image>}
   */
  loadImage(key, src) {
    return new Promise((resolve, reject) => {
      console.log(`[AssetManager] 加载图片: ${key} -> ${src}`);
      
      const image = wx.createImage();
      
      image.onload = () => {
        console.log(`[AssetManager] 图片加载成功: ${key}`);
        this.images.set(key, image);
        this.loadedAssets++;
        this.updateProgress();
        resolve(image);
      };

      image.onerror = (err) => {
        console.error(`[AssetManager] 图片加载失败: ${key}`, err);
        this.loadedAssets++;
        this.updateProgress();
        reject(err);
      };

      image.src = src;
    });
  }

  /**
   * 加载音频
   * @param {string} key - 资源标识
   * @param {string} src - 音频路径
   * @returns {Promise<string>}
   */
  loadAudio(key, src) {
    return new Promise((resolve) => {
      console.log(`[AssetManager] 注册音频: ${key} -> ${src}`);
      // 音频不实际加载，只记录路径，由AudioManager管理实例
      this.audios.set(key, src);
      this.loadedAssets++;
      this.updateProgress();
      resolve(src);
    });
  }

  /**
   * 更新加载进度
   */
  updateProgress() {
    if (this.totalAssets > 0) {
      this.loadProgress = Math.floor((this.loadedAssets / this.totalAssets) * 100);
    }
  }

  /**
   * 获取图片资源
   * @param {string} key - 资源标识
   * @returns {Image|null}
   */
  getImage(key) {
    return this.images.get(key) || null;
  }

  /**
   * 检查图片是否存在
   * @param {string} key - 资源标识
   * @returns {boolean}
   */
  hasImage(key) {
    return this.images.has(key);
  }

  /**
   * 获取音频路径
   * @param {string} key - 资源标识
   * @returns {string|null}
   */
  getAudioPath(key) {
    return this.audios.get(key) || null;
  }

  /**
   * 检查音频是否存在
   * @param {string} key - 资源标识
   * @returns {boolean}
   */
  hasAudio(key) {
    return this.audios.has(key);
  }

  /**
   * 预创建图片占位（用于未来替换）
   * 可在需要时调用此方法创建空白图片对象
   */
  createPlaceholderImage(width, height, color) {
    // 创建离屏canvas来生成占位图片
    const offscreen = wx.createOffscreenCanvas({
      type: '2d',
      width: width,
      height: height
    });
    const ctx = offscreen.getContext('2d');
    
    ctx.fillStyle = color || '#cccccc';
    ctx.fillRect(0, 0, width, height);
    
    return offscreen;
  }

  /**
   * 获取加载进度
   * @returns {number} 0-100
   */
  getProgress() {
    return this.loadProgress;
  }

  /**
   * 是否已加载完成
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 添加资源路径（动态配置）
   * @param {string} type - 'image' 或 'audio'
   * @param {string} key - 资源标识
   * @param {string} path - 资源路径
   */
  addResource(type, key, path) {
    if (type === 'image') {
      this.config.images[key] = path;
    } else if (type === 'audio') {
      this.config.audios[key] = path;
    }
  }

  /**
   * 批量添加资源
   * @param {Object} resources - { images: {}, audios: {} }
   */
  addResources(resources) {
    if (resources.images) {
      Object.assign(this.config.images, resources.images);
    }
    if (resources.audios) {
      Object.assign(this.config.audios, resources.audios);
    }
  }
}

// 单例实例
export const assetManager = new AssetManager();
export default assetManager;
