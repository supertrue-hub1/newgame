// Shared game types for Minecraft Block Breaker

export interface Block {
  id: string
  type: 'dirt' | 'stone' | 'grass' | 'diamond' | 'gold' | 'coal'
  position: { x: number; y: number; z: number }
  velocity: number
  health: number
}

export interface GameState {
  blocks: Block[]
  score: number
  combo: number
  gameOver: boolean
  lineHealth: number
}

export interface BlockConfig {
  type: Block['type']
  color: string
  points: number
  health: number
}

export const BLOCK_CONFIGS: Record<Block['type'], BlockConfig> = {
  dirt: { type: 'dirt', color: '#8B5A2B', points: 1, health: 1 },
  grass: { type: 'grass', color: '#5D8C3E', points: 1, health: 1 },
  stone: { type: 'stone', color: '#7D7D7D', points: 1, health: 2 },
  coal: { type: 'coal', color: '#3D3D3D', points: 2, health: 1 },
  gold: { type: 'gold', color: '#FFD700', points: 3, health: 1 },
  diamond: { type: 'diamond', color: '#4AEDD9', points: 5, health: 1 },
}

// Socket event types
export interface ServerToClientEvents {
  game_state: (state: GameState) => void
  block_spawned: (block: Block) => void
  block_destroyed: (data: { blockId: string; points: number; position: { x: number; y: number; z: number } }) => void
  update_score: (data: { score: number; combo?: number; points?: number }) => void
  update_health: (data: { health: number }) => void
  line_damaged: (data: { health: number; blockId: string }) => void
  game_over: (data: { score: number }) => void
  game_started: () => void
}

export interface ClientToServerEvents {
  identify: (data: { type: 'projector' | 'phone'; name?: string }) => void
  BREAK_BLOCK: (data: { blockId?: string }) => void
  block_missed: (data: { blockId: string }) => void
  request_spawn: () => void
  start_game: () => void
}
