export type BlockType = 'dirt' | 'grass' | 'stone' | 'wood' | 'gold' | 'diamond' | 'emerald';

export interface Block {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  z: number;
  velocityY: number;
}

export interface Player {
  id: string;
  score: number;
}

export interface GameState {
  blocks: Block[];
  players: Map<string, Player>;
  isRunning: boolean;
}

export interface ServerToClientEvents {
  'game-state': (state: GameState) => void;
  'spawn-block': (block: Block) => void;
  'destroy-block': (blockId: string, position: { x: number; y: number; z: number }) => void;
  'update-score': (playerId: string, score: number) => void;
  'player-connected': (playerId: string) => void;
  'player-disconnected': (playerId: string) => void;
}

export interface ClientToServerEvents {
  'join-game': (playerId: string) => void;
  'break-block': (blockId: string) => void;
  'start-game': () => void;
}
