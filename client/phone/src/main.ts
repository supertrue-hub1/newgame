import { io } from 'socket.io-client';

const SERVER_URL = window.location.origin;

interface Block {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
}

class PhoneController {
  private socket: any;
  private blocks: Block[] = [];
  private score: number = 0;
  private lastTap: number = 0;
  private combo: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.initSocket();
    this.initEventListeners();
  }

  private initSocket(): void {
    this.socket = io(SERVER_URL);

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateStatus('Подключено!', false);
      
      const playerId = 'phone-' + Math.random().toString(36).substr(2, 9);
      this.socket.emit('join-game', playerId);
      
      const mineBtn = document.getElementById('mine-btn') as HTMLButtonElement;
      mineBtn.disabled = false;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected');
      this.updateStatus('Отключено!', true);
      
      const mineBtn = document.getElementById('mine-btn') as HTMLButtonElement;
      mineBtn.disabled = true;
    });

    this.socket.on('game-state', (state: any) => {
      this.blocks = state.blocks || [];
      const player = state.players?.get(this.socket.id);
      if (player) {
        this.updateScore(player.score);
      }
    });

    this.socket.on('spawn-block', (block: Block) => {
      const existing = this.blocks.find(b => b.id === block.id);
      if (!existing) {
        this.blocks.push(block);
      }
    });

    this.socket.on('destroy-block', (blockId: string) => {
      this.blocks = this.blocks.filter(b => b.id !== blockId);
    });

    this.socket.on('update-score', (playerId: string, score: number) => {
      if (playerId === this.socket.id) {
        this.updateScore(score);
      }
    });

    this.socket.on('player-connected', () => {
      this.updatePlayerCount();
    });

    this.socket.on('player-disconnected', () => {
      this.updatePlayerCount();
    });
  }

  private initEventListeners(): void {
    const mineBtn = document.getElementById('mine-btn');
    if (mineBtn) {
      mineBtn.addEventListener('click', () => this.mine());
      mineBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.mine();
      }, { passive: false });
    }
  }

  private mine(): void {
    if (this.blocks.length === 0) return;

    const now = Date.now();
    this.combo = (now - this.lastTap < 800) ? this.combo + 1 : 1;
    this.lastTap = now;

    const blockIndex = Math.floor(Math.random() * this.blocks.length);
    const block = this.blocks[blockIndex];
    
    this.socket.emit('break-block', block.id);

    this.vibrate(50);
    this.showTapEffect();
    
    if (this.combo >= 2) {
      this.showCombo(this.combo);
    }
  }

  private vibrate(ms: number): void {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  private showTapEffect(): void {
    const btn = document.getElementById('mine-btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const effect = document.createElement('div');
    effect.className = 'tap-effect';
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 300);
  }

  private showCombo(combo: number): void {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `COMBO x${combo}!`;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 500);
  }

  private updateScore(score: number): void {
    this.score = score;
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = score.toString();
    }
  }

  private updateStatus(text: string, isError: boolean): void {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = isError ? 'error' : '';
    }
  }

  private updatePlayerCount(): void {
    // Player count would come from server
  }
}

new PhoneController();
