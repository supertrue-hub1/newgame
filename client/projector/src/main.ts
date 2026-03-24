import { io } from 'socket.io-client';
import * as THREE from 'three';
import { initScene, addBlockToScene, updateBlockPosition, removeBlockFromScene, render } from './scene.js';

const SERVER_URL = window.location.origin;

interface Block {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  velocityY: number;
}

class MinecraftAR {
  private socket: any;
  private blocks: Map<string, Block> = new Map();
  private score: number = 0;
  private animationId: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    initScene(canvas);
    this.initSocket();
    this.initEventListeners();
    this.animate();
  }

  private initSocket(): void {
    this.socket = io(SERVER_URL);

    this.socket.on('connect', () => {
      console.log('Connected');
      this.socket.emit('join-game', 'projector');
    });

    this.socket.on('game-state', (state: any) => {
      console.log('Game state:', state);
      this.updateScore(state.players?.get(this.socket.id)?.score || 0);
    });

    this.socket.on('spawn-block', (block: Block) => {
      this.handleSpawnBlock(block);
    });

    this.socket.on('destroy-block', (blockId: string, position: { x: number; y: number; z: number }) => {
      this.handleDestroyBlock(blockId, position);
    });

    this.socket.on('update-score', (playerId: string, score: number) => {
      if (playerId === this.socket.id) {
        this.updateScore(score);
      }
    });

    this.socket.on('player-connected', (playerId: string) => {
      this.updateStatus(`Игрок подключен: ${playerId.slice(0, 8)}`);
    });

    this.socket.on('player-disconnected', (playerId: string) => {
      this.updateStatus(`Игрок отключился: ${playerId.slice(0, 8)}`);
    });
  }

  private initEventListeners(): void {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.socket.emit('start-game');
        document.getElementById('start-overlay')?.classList.add('hidden');
      });
    }
  }

  private handleSpawnBlock(block: Block): void {
    this.blocks.set(block.id, block);
    addBlockToScene(block.id, block.type, block.x, block.y, block.z);
  }

  private handleDestroyBlock(blockId: string, position: { x: number; y: number; z: number }): void {
    this.blocks.delete(blockId);
    removeBlockFromScene(blockId, position.x, position.y, position.z);
    
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      const rect = scoreEl.getBoundingClientRect();
      this.showScorePopup(rect.left + rect.width / 2, rect.top, `+${this.getBlockPoints(blockId)}`);
    }
  }

  private getBlockPoints(blockId: string): number {
    const block = this.blocks.get(blockId);
    const points: Record<string, number> = {
      dirt: 1, grass: 1, stone: 1, wood: 2, gold: 3, diamond: 5, emerald: 4
    };
    return points[block?.type || 'dirt'] || 1;
  }

  private showScorePopup(x: number, y: number, text: string): void {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = text;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  private updateScore(score: number): void {
    this.score = score;
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score.toString();
  }

  private updateStatus(text: string): void {
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.textContent = text;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.blocks.forEach((block, id) => {
      block.y += block.velocityY;
      updateBlockPosition(id, block.y);
    });
    
    render();
  }
}

new MinecraftAR();
