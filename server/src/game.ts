import type { Block, BlockType, GameState, Player } from './types.js';

const BLOCK_TYPES: { type: BlockType; points: number; weight: number }[] = [
  { type: 'dirt', points: 1, weight: 30 },
  { type: 'grass', points: 1, weight: 25 },
  { type: 'stone', points: 1, weight: 20 },
  { type: 'wood', points: 2, weight: 12 },
  { type: 'gold', points: 3, weight: 7 },
  { type: 'diamond', points: 5, weight: 4 },
  { type: 'emerald', points: 4, weight: 2 },
];

const GAME_BOUNDS = {
  minX: -3,
  maxX: 3,
  minY: 0,
  maxY: 6,
  minZ: -3,
  maxZ: 3,
  groundY: -0.5,
};

let gameState: GameState = {
  blocks: [],
  players: new Map(),
  isRunning: false,
};

let blockIdCounter = 0;
let spawnInterval: any = null;

export function getRandomBlockType(): BlockType {
  const totalWeight = BLOCK_TYPES.reduce((sum, b) => sum + b.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const block of BLOCK_TYPES) {
    random -= block.weight;
    if (random <= 0) return block.type;
  }
  return 'dirt';
}

export function spawnBlock(): Block {
  const block: Block = {
    id: `block-${++blockIdCounter}`,
    type: getRandomBlockType(),
    x: GAME_BOUNDS.minX + Math.random() * (GAME_BOUNDS.maxX - GAME_BOUNDS.minX),
    y: GAME_BOUNDS.maxY,
    z: GAME_BOUNDS.minZ + Math.random() * (GAME_BOUNDS.maxZ - GAME_BOUNDS.minZ),
    velocityY: -0.03 - Math.random() * 0.02,
  };
  
  gameState.blocks.push(block);
  return block;
}

export function updatePhysics(): void {
  gameState.blocks = gameState.blocks.filter(block => {
    block.y += block.velocityY;
    if (block.y <= GAME_BOUNDS.groundY) {
      return false;
    }
    return true;
  });
}

export function breakBlock(blockId: string): { block: Block | null, points: number } {
  const blockIndex = gameState.blocks.findIndex(b => b.id === blockId);
  
  if (blockIndex === -1) {
    return { block: null, points: 0 };
  }
  
  const block = gameState.blocks[blockIndex];
  const blockType = BLOCK_TYPES.find(bt => bt.type === block.type);
  const points = blockType?.points || 1;
  
  gameState.blocks.splice(blockIndex, 1);
  
  return { block, points };
}

export function addScore(playerId: string, points: number): void {
  const player = gameState.players.get(playerId);
  if (player) {
    player.score += points;
  }
}

export function addPlayer(playerId: string): void {
  gameState.players.set(playerId, { id: playerId, score: 0 });
}

export function removePlayer(playerId: string): void {
  gameState.players.delete(playerId);
}

export function getGameState(): GameState {
  return gameState;
}

export function startGame(): void {
  if (gameState.isRunning) return;
  
  gameState.isRunning = true;
  gameState.blocks = [];
  blockIdCounter = 0;
  
  spawnInterval = setInterval(() => {
    if (gameState.blocks.length < 25) {
      spawnBlock();
    }
    updatePhysics();
  }, 50);
}

export function stopGame(): void {
  gameState.isRunning = false;
  if (spawnInterval) {
    clearInterval(spawnInterval);
  }
}

export function resetGame(): void {
  stopGame();
  gameState.blocks = [];
  gameState.players.forEach(player => player.score = 0);
}
