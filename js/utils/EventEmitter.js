/**
 * 简单的事件发射器
 * 用于场景间通信和组件解耦
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.events[event]) return this;
    if (!callback) {
      delete this.events[event];
      return this;
    }
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return this;
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (e) {
        console.error('Event callback error:', e);
      }
    });
    return this;
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    return this.on(event, onceCallback);
  }
}

// 全局事件总线
export const globalEvent = new EventEmitter();
