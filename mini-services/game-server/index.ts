import { Server } from 'socket.io'

const PORT = 3001

// Game State Types
interface Block {
  id: string
  type: 'dirt' | 'stone' | 'grass' | 'diamond' | 'gold' | 'coal'
  position: { x: number; y: number; z: number }
  velocity: number
  health: number
}

interface GameState {
  blocks: Block[]
  score: number
  combo: number
  gameOver: boolean
  lineHealth: number
  players: Map<string, { name: string; score: number }>
}

// Initialize game state
const gameState: GameState = {
  blocks: [],
  score: 0,
  combo: 0,
  gameOver: false,
  lineHealth: 100,
  players: new Map()
}

// Block spawn configuration
const BLOCK_TYPES = [
  { type: 'dirt' as const, weight: 30, points: 1, health: 1 },
  { type: 'grass' as const, weight: 25, points: 1, health: 1 },
  { type: 'stone' as const, weight: 20, points: 1, health: 2 },
  { type: 'coal' as const, weight: 10, points: 2, health: 1 },
  { type: 'gold' as const, weight: 10, points: 3, health: 1 },
  { type: 'diamond' as const, weight: 5, points: 5, health: 1 },
]

// Helper to get random block type
function getRandomBlockType() {
  const totalWeight = BLOCK_TYPES.reduce((sum, b) => sum + b.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const block of BLOCK_TYPES) {
    random -= block.weight
    if (random <= 0) return block
  }
  return BLOCK_TYPES[0]
}

// Generate unique block ID
let blockIdCounter = 0
function generateBlockId() {
  return `block_${Date.now()}_${blockIdCounter++}`
}

// Create new block
function spawnBlock(): Block {
  const blockType = getRandomBlockType()
  return {
    id: generateBlockId(),
    type: blockType.type,
    position: {
      x: (Math.random() - 0.5) * 8,
      y: 10,
      z: (Math.random() - 0.5) * 4
    },
    velocity: 0.5 + Math.random() * 0.5,
    health: blockType.health
  }
}

// Create Socket.io server
const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
})

console.log(`🎮 Game Server running on port ${PORT}`)

// Connection handling
io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`)
  
  // Determine client type
  socket.on('identify', (data: { type: 'projector' | 'phone', name?: string }) => {
    if (data.type === 'projector') {
      socket.join('projectors')
      console.log(`🖥️ Projector connected: ${socket.id}`)
      
      // Send current game state
      socket.emit('game_state', {
        blocks: gameState.blocks,
        score: gameState.score,
        lineHealth: gameState.lineHealth
      })
    } else if (data.type === 'phone') {
      socket.join('phones')
      const playerName = data.name || `Player_${socket.id.slice(0, 4)}`
      gameState.players.set(socket.id, { name: playerName, score: 0 })
      console.log(`📱 Phone connected: ${socket.id} as ${playerName}`)
      
      // Send current score
      socket.emit('update_score', { score: gameState.score })
    }
  })
  
  // Handle block breaking from phone
  socket.on('BREAK_BLOCK', (data: { blockId?: string }) => {
    if (gameState.gameOver) return
    
    // If specific block ID provided, destroy that block
    if (data.blockId) {
      const blockIndex = gameState.blocks.findIndex(b => b.id === data.blockId)
      if (blockIndex !== -1) {
        const block = gameState.blocks[blockIndex]
        const blockConfig = BLOCK_TYPES.find(b => b.type === block.type)
        
        // Update score with combo
        gameState.combo++
        const points = (blockConfig?.points || 1) * Math.min(gameState.combo, 5)
        gameState.score += points
        
        // Remove block
        gameState.blocks.splice(blockIndex, 1)
        
        // Emit to projector
        io.to('projectors').emit('block_destroyed', {
          blockId: data.blockId,
          points,
          position: block.position
        })
        
        // Emit score update to all phones
        io.to('phones').emit('update_score', { 
          score: gameState.score,
          combo: gameState.combo,
          points
        })
        
        console.log(`💥 Block ${data.blockId} destroyed! +${points} points (combo x${gameState.combo})`)
      }
    } else {
      // Legacy: destroy nearest block to bottom
      if (gameState.blocks.length === 0) return
      
      // Find block closest to the defense line (lowest y)
      const sortedBlocks = [...gameState.blocks].sort((a, b) => a.position.y - b.position.y)
      const targetBlock = sortedBlocks[0]
      
      if (targetBlock) {
        const blockConfig = BLOCK_TYPES.find(b => b.type === targetBlock.type)
        
        // Update score with combo
        gameState.combo++
        const points = (blockConfig?.points || 1) * Math.min(gameState.combo, 5)
        gameState.score += points
        
        // Remove block
        gameState.blocks = gameState.blocks.filter(b => b.id !== targetBlock.id)
        
        // Emit to projector
        io.to('projectors').emit('block_destroyed', {
          blockId: targetBlock.id,
          points,
          position: targetBlock.position
        })
        
        // Emit score update to all phones
        io.to('phones').emit('update_score', { 
          score: gameState.score,
          combo: gameState.combo,
          points
        })
        
        console.log(`💥 Block ${targetBlock.id} destroyed! +${points} points`)
      }
    }
    
    // Reset combo after delay
    setTimeout(() => {
      gameState.combo = 0
    }, 1500)
  })
  
  // Handle block reached defense line
  socket.on('block_missed', (data: { blockId: string }) => {
    gameState.lineHealth -= 10
    gameState.combo = 0
    
    // Remove block
    gameState.blocks = gameState.blocks.filter(b => b.id !== data.blockId)
    
    // Notify all clients
    io.to('projectors').emit('line_damaged', { 
      health: gameState.lineHealth,
      blockId: data.blockId 
    })
    io.to('phones').emit('update_health', { health: gameState.lineHealth })
    
    console.log(`💔 Block missed! Line health: ${gameState.lineHealth}%`)
    
    // Check game over
    if (gameState.lineHealth <= 0) {
      gameState.gameOver = true
      io.emit('game_over', { score: gameState.score })
      console.log(`🏁 Game Over! Final score: ${gameState.score}`)
    }
  })
  
  // Request to spawn new block (from projector)
  socket.on('request_spawn', () => {
    const newBlock = spawnBlock()
    gameState.blocks.push(newBlock)
    io.to('projectors').emit('block_spawned', newBlock)
    console.log(`🧱 Block spawned: ${newBlock.id} (${newBlock.type})`)
  })
  
  // Start new game
  socket.on('start_game', () => {
    gameState.blocks = []
    gameState.score = 0
    gameState.combo = 0
    gameState.gameOver = false
    gameState.lineHealth = 100
    
    io.emit('game_started')
    console.log(`🎮 New game started!`)
    
    // Spawn initial blocks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const newBlock = spawnBlock()
        gameState.blocks.push(newBlock)
        io.to('projectors').emit('block_spawned', newBlock)
      }, i * 500)
    }
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`📡 Client disconnected: ${socket.id}`)
    gameState.players.delete(socket.id)
  })
})

// Game loop - spawn blocks periodically
setInterval(() => {
  if (!gameState.gameOver && gameState.blocks.length < 20) {
    const newBlock = spawnBlock()
    gameState.blocks.push(newBlock)
    io.to('projectors').emit('block_spawned', newBlock)
  }
}, 2000)

// Health check endpoint
console.log(`✅ Game Server ready!`)
console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
