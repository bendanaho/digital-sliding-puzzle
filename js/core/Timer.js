/**
 * 计时器类
 * 管理游戏计时功能
 */

export class Timer {
  constructor() {
    this.startTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * 开始计时
   */
  start() {
    if (this.isRunning) return;
    
    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.isPaused = false;
  }

  /**
   * 停止计时
   */
  stop() {
    if (!this.isRunning) return;
    
    this.elapsedTime = Date.now() - this.startTime;
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * 暂停计时
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.elapsedTime = Date.now() - this.startTime;
    this.isPaused = true;
    this.isRunning = false;
  }

  /**
   * 恢复计时
   */
  resume() {
    if (!this.isPaused) return;
    
    this.startTime = Date.now() - this.elapsedTime;
    this.isPaused = false;
    this.isRunning = true;
  }

  /**
   * 重置计时器
   */
  reset() {
    this.startTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.isPaused = false;
  }

  /**
   * 获取当前时间（毫秒）
   */
  getTime() {
    if (this.isRunning) {
      return Date.now() - this.startTime;
    }
    return this.elapsedTime;
  }

  /**
   * 获取格式化的时间字符串
   * @returns {string} 格式: MM:SS 或 MM:SS.ms
   */
  getFormattedTime(showMilliseconds = false) {
    const time = this.getTime();
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((time % 1000) / 10);
    
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    
    if (showMilliseconds) {
      const mms = ms.toString().padStart(2, '0');
      return `${mm}:${ss}.${mms}`;
    }
    
    return `${mm}:${ss}`;
  }

  /**
   * 获取时间对象
   * @returns {Object} { minutes, seconds, milliseconds }
   */
  getTimeObject() {
    const time = this.getTime();
    const totalSeconds = Math.floor(time / 1000);
    
    return {
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
      milliseconds: time % 1000,
      totalMilliseconds: time
    };
  }

  /**
   * 检查是否正在运行
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * 检查是否已暂停
   */
  isOnPause() {
    return this.isPaused;
  }
}

export default Timer;
