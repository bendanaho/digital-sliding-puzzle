/**
 * 棋盘逻辑类
 * 管理数字华容道的游戏逻辑：生成、打乱、移动、胜利判定
 */

import { Block } from '../ui/Block.js';
import { audioManager, SoundType } from '../audio/AudioManager.js';

export class Board {
  constructor(size, options = {}) {
    this.size = size;  // 4 或 5
    this.grid = [];    // 二维数组存储数字
    this.blocks = [];  // Block 对象数组
    
    // 空格位置
    this.emptyRow = size - 1;
    this.emptyCol = size - 1;
    
    // 棋盘绘制参数
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.blockSize = options.blockSize || 80;
    this.blockGap = options.blockGap || 10;
    
    // 颜色配置
    this.blockColors = options.blockColors || null;
    
    // 移动历史（用于撤销，可选）
    this.moveHistory = [];
    
    // 步数
    this.moveCount = 0;
    
    // 动画锁
    this.isAnimating = false;
    
    // 操作队列（用于缓存动画期间的点击）
    this.moveQueue = [];
    this.isProcessingQueue = false;
    
    // 初始化
    this._initGrid();
  }

  /**
   * 初始化棋盘（完成状态）
   */
  _initGrid() {
    this.grid = [];
    this.blocks = [];
    this.moveHistory = [];
    this.moveCount = 0;
    
    for (let row = 0; row < this.size; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.size; col++) {
        // 计算数值：1 到 size*size-1，最后一个为空格(0)
        const value = row * this.size + col + 1;
        if (value < this.size * this.size) {
          this.grid[row][col] = value;
        } else {
          this.grid[row][col] = 0;  // 空格
          this.emptyRow = row;
          this.emptyCol = col;
        }
      }
    }
    
    this._createBlocks();
  }

  /**
   * 创建方块对象
   */
  _createBlocks() {
    this.blocks = [];
    
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const value = this.grid[row][col];
        const pos = this._getBlockPosition(row, col);
        
        const block = new Block({
          value: value,
          row: row,
          col: col,
          x: pos.x,
          y: pos.y,
          width: this.blockSize,
          height: this.blockSize,
          borderRadius: this.blockSize * 0.15,
          bgColor: this._getBlockColor(value)
        });
        
        this.blocks.push(block);
      }
    }
  }

  /**
   * 获取方块颜色
   */
  _getBlockColor(value) {
    if (value === 0) return '#F0F0F0';
    
    if (this.blockColors && this.blockColors[value]) {
      return this.blockColors[value];
    }
    
    // 默认颜色方案（使用十六进制，颜色加深）
    const colors = [
      '#2E5A8C', '#3A6FA3', '#4684BA', '#245078', '#1A4060',
      '#3A7D70', '#469286', '#52A79C', '#2E6D62', '#245A50',
      '#4B3F8C', '#5D4FA3', '#6F5FBA', '#3D2F78', '#2F2060',
      '#C74A4A', '#D95C5C', '#EB6E6E', '#B53A3A', '#A32828',
      '#D97A52', '#E98E66', '#F9A27A', '#C96A42', '#B95832'
    ];
    return colors[(value - 1) % colors.length];
  }

  /**
   * 计算方块像素位置
   */
  _getBlockPosition(row, col) {
    return {
      x: this.x + col * (this.blockSize + this.blockGap),
      y: this.y + row * (this.blockSize + this.blockGap)
    };
  }

  /**
   * 获取方块
   */
  getBlock(row, col) {
    return this.blocks.find(b => b.row === row && b.col === col);
  }

  /**
   * 获取数值对应的方块
   */
  getBlockByValue(value) {
    return this.blocks.find(b => b.value === value);
  }

  /**
   * 检查是否可以移动
   */
  canMove(row, col) {
    // 检查是否与空格相邻
    const rowDiff = Math.abs(row - this.emptyRow);
    const colDiff = Math.abs(col - this.emptyCol);
    
    // 必须是一行或一列相邻
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * 移动方块
   * @param {Block} block - 要移动的方块
   * @param {boolean} animate - 是否播放动画
   * @returns {Promise<boolean>} 是否成功移动
   */
  async moveBlock(block, animate = true) {
    if (!block || block.value === 0) return false;
    if (!this.canMove(block.row, block.col)) return false;
    
    // 如果正在动画，将操作加入队列
    if (this.isAnimating) {
      this.moveQueue.push({ block, animate });
      return false;
    }
    
    this.isAnimating = true;
    
    // 记录移动历史
    this.moveHistory.push({
      value: block.value,
      from: { row: block.row, col: block.col },
      to: { row: this.emptyRow, col: this.emptyCol }
    });
    
    // 交换网格数据
    this.grid[this.emptyRow][this.emptyCol] = block.value;
    this.grid[block.row][block.col] = 0;
    
    // 更新空格位置
    const oldEmptyRow = this.emptyRow;
    const oldEmptyCol = this.emptyCol;
    this.emptyRow = block.row;
    this.emptyCol = block.col;
    
    // 更新方块位置
    block.targetRow = oldEmptyRow;
    block.targetCol = oldEmptyCol;
    
    // 播放音效
    audioManager.play(SoundType.BLOCK_MOVE);
    
    // 播放点击动画
    block.playClickAnimation();
    
    // 位移动画
    const newPos = this._getBlockPosition(oldEmptyRow, oldEmptyCol);
    await block.setPixelPosition(newPos.x, newPos.y, animate, 180);
    
    // 更新方块行列属性
    block.row = oldEmptyRow;
    block.col = oldEmptyCol;
    
    this.moveCount++;
    this.isAnimating = false;
    
    // 处理队列中的下一个操作
    this._processQueue();
    
    return true;
  }
  
  /**
   * 处理操作队列
   */
  _processQueue() {
    if (this.isProcessingQueue || this.moveQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    // 取出队列中的第一个操作
    const { block, animate } = this.moveQueue.shift();
    
    // 执行移动
    this.moveBlock(block, animate).then(() => {
      this.isProcessingQueue = false;
      // 继续处理队列中的下一个
      this._processQueue();
    });
  }

  /**
   * 根据行列移动（如果可移动）
   */
  async moveAt(row, col, animate = true) {
    const block = this.getBlock(row, col);
    return this.moveBlock(block, animate);
  }

  /**
   * 根据点击位置移动
   */
  async moveAtPosition(x, y, animate = true) {
    // 找到点击的方块
    for (let block of this.blocks) {
      if (block.contains(x, y) && block.value !== 0) {
        return this.moveBlock(block, animate);
      }
    }
    return false;
  }

  /**
   * 打乱棋盘（保证可解）
   * 从完成状态出发，随机执行N次合法移动
   */
  async shuffle(moveCount) {
    this.isAnimating = true;
    
    // 默认移动次数
    const moves = moveCount || (this.size === 4 ? 80 : 150);
    
    // 记录上一次移动的方向，避免立即回退
    let lastDirection = null;
    
    for (let i = 0; i < moves; i++) {
      // 每 10 次移动让出时间片，避免阻塞渲染（真机需要）
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      // 获取可移动的方向
      const possibleMoves = [];
      
      // 上
      if (this.emptyRow > 0 && lastDirection !== 'down') {
        possibleMoves.push({
          row: this.emptyRow - 1,
          col: this.emptyCol,
          direction: 'up'
        });
      }
      // 下
      if (this.emptyRow < this.size - 1 && lastDirection !== 'up') {
        possibleMoves.push({
          row: this.emptyRow + 1,
          col: this.emptyCol,
          direction: 'down'
        });
      }
      // 左
      if (this.emptyCol > 0 && lastDirection !== 'right') {
        possibleMoves.push({
          row: this.emptyRow,
          col: this.emptyCol - 1,
          direction: 'left'
        });
      }
      // 右
      if (this.emptyCol < this.size - 1 && lastDirection !== 'left') {
        possibleMoves.push({
          row: this.emptyRow,
          col: this.emptyCol + 1,
          direction: 'right'
        });
      }
      
      // 随机选择一个方向
      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      
      if (move) {
        // 移动（无动画）
        const block = this.getBlock(move.row, move.col);
        
        // 交换网格数据
        this.grid[this.emptyRow][this.emptyCol] = block.value;
        this.grid[block.row][block.col] = 0;
        
        // 更新空格位置
        const oldEmptyRow = this.emptyRow;
        const oldEmptyCol = this.emptyCol;
        this.emptyRow = block.row;
        this.emptyCol = block.col;
        
        // 更新方块
        block.row = oldEmptyRow;
        block.col = oldEmptyCol;
        block.targetRow = oldEmptyRow;
        block.targetCol = oldEmptyCol;
        
        const pos = this._getBlockPosition(oldEmptyRow, oldEmptyCol);
        block.x = pos.x;
        block.y = pos.y;
        block.targetX = pos.x;
        block.targetY = pos.y;
        
        lastDirection = move.direction;
      }
    }
    
    // 重置步数（打乱不算步数）
    this.moveCount = 0;
    this.moveHistory = [];
    this.isAnimating = false;
  }

  /**
   * 检查是否胜利
   * 数字回到目标顺序且空格在最后
   */
  checkWin() {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const expectedValue = row * this.size + col + 1;
        const actualValue = this.grid[row][col];
        
        // 最后一个应该是空格(0)
        if (row === this.size - 1 && col === this.size - 1) {
          if (actualValue !== 0) return false;
        } else {
          if (actualValue !== expectedValue) return false;
        }
      }
    }
    return true;
  }

  /**
   * 检查点是否在棋盘区域内
   */
  contains(x, y) {
    const boardWidth = this.size * this.blockSize + (this.size - 1) * this.blockGap;
    const boardHeight = boardWidth;
    
    return x >= this.x && 
           x <= this.x + boardWidth && 
           y >= this.y && 
           y <= this.y + boardHeight;
  }

  /**
   * 获取步数
   */
  getMoveCount() {
    return this.moveCount;
  }

  /**
   * 重置棋盘
   */
  reset() {
    this._initGrid();
  }

  /**
   * 更新棋盘位置（用于屏幕适配）
   */
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    
    // 更新所有方块位置
    for (let block of this.blocks) {
      const pos = this._getBlockPosition(block.row, block.col);
      block.x = pos.x;
      block.y = pos.y;
      block.targetX = pos.x;
      block.targetY = pos.y;
    }
  }

  /**
   * 绘制棋盘
   */
  draw(ctx) {
    // 绘制所有方块
    for (let block of this.blocks) {
      block.draw(ctx);
    }
  }

  /**
   * 入场动画
   */
  playEnterAnimation() {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      if (block.value !== 0) {
        block.playEnterAnimation(i * 30);
      }
    }
  }

  /**
   * 销毁
   */
  destroy() {
    for (let block of this.blocks) {
      block.destroy();
    }
    this.blocks = [];
  }
}

export default Board;
