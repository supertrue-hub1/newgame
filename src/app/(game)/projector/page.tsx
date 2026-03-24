'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { io, Socket } from 'socket.io-client'
import * as THREE from 'three'

// Game configuration
const BLOCK_CONFIGS: Record<string, { color: number; points: number }> = {
  dirt: { color: 0x8B5A2B, points: 1 },
  grass: { color: 0x5D8C3E, points: 1 },
  stone: { color: 0x7D7D7D, points: 1 },
  coal: { color: 0x3D3D3D, points: 2 },
  gold: { color: 0xFFD700, points: 3 },
  diamond: { color: 0x4AEDD9, points: 5 },
}

interface Block {
  id: string
  type: string
  position: { x: number; y: number; z: number }
  velocity: number
  health: number
}

interface BlockMesh extends THREE.Mesh {
  userData: {
    blockId: string
    blockType: string
    velocity: number
    health: number
  }
}

export default function ProjectorPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const blocksRef = useRef<Map<string, BlockMesh>>(new Map())
  const particlesRef = useRef<THREE.Points[]>([])
  const socketRef = useRef<Socket | null>(null)
  const animationRef = useRef<number | null>(null)
  
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lineHealth, setLineHealth] = useState(100)
  const [gameStarted, setGameStarted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showUI, setShowUI] = useState(true)

  // Helper function to remove block from scene
  const removeBlockFromScene = useCallback((blockId: string) => {
    const mesh = blocksRef.current.get(blockId)
    if (mesh && sceneRef.current) {
      sceneRef.current.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      blocksRef.current.delete(blockId)
    }
  }, [])

  // Create particle explosion
  const createExplosion = useCallback((position: { x: number; y: number; z: number }, color: number) => {
    if (!sceneRef.current) return

    const particleCount = 30
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const threeColor = new THREE.Color(color)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2
      
      colors[i * 3] = threeColor.r
      colors[i * 3 + 1] = threeColor.g
      colors[i * 3 + 2] = threeColor.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 1
    })

    const particles = new THREE.Points(geometry, material)
    sceneRef.current.add(particles)
    particlesRef.current.push(particles)
  }, [])

  // Create block mesh
  const createBlockMesh = useCallback((block: Block) => {
    if (!sceneRef.current) return

    const config = BLOCK_CONFIGS[block.type] || BLOCK_CONFIGS.dirt
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshLambertMaterial({ color: config.color })
    
    const mesh = new THREE.Mesh(geometry, material) as BlockMesh
    mesh.position.set(block.position.x, block.position.y, block.position.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    mesh.userData = {
      blockId: block.id,
      blockType: block.type,
      velocity: block.velocity,
      health: block.health
    }

    const edges = new THREE.EdgesGeometry(geometry)
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })
    const outline = new THREE.LineSegments(edges, outlineMaterial)
    mesh.add(outline)

    sceneRef.current.add(mesh)
    blocksRef.current.set(block.id, mesh)
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 20, 50)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 5, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Ground
    const groundGeometry = new THREE.BoxGeometry(20, 2, 10)
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x5D8C3E })
    const ground = new THREE.Mesh(groundGeometry, grassMaterial)
    ground.position.y = -6
    ground.receiveShadow = true
    scene.add(ground)

    // Dirt layer
    const dirtGeometry = new THREE.BoxGeometry(20, 3, 10)
    const dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B })
    const dirt = new THREE.Mesh(dirtGeometry, dirtMaterial)
    dirt.position.y = -8.5
    scene.add(dirt)

    // Defense line
    const lineGeometry = new THREE.BoxGeometry(20, 0.3, 0.3)
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4444 })
    const defenseLine = new THREE.Mesh(lineGeometry, lineMaterial)
    defenseLine.position.y = -4
    defenseLine.name = 'defenseLine'
    scene.add(defenseLine)

    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      
      // Update blocks
      const blocksToRemove: string[] = []
      blocksRef.current.forEach((blockMesh) => {
        blockMesh.position.y -= blockMesh.userData.velocity * 0.016
        if (blockMesh.position.y < -4) {
          socketRef.current?.emit('block_missed', { blockId: blockMesh.userData.blockId })
          blocksToRemove.push(blockMesh.userData.blockId)
        }
      })
      blocksToRemove.forEach(id => removeBlockFromScene(id))

      // Update particles
      particlesRef.current = particlesRef.current.filter((particles) => {
        const positions = particles.geometry.attributes.position.array as Float32Array
        let allDead = true
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] -= 0.1
          if (positions[i + 1] > -10) allDead = false
        }
        particles.geometry.attributes.position.needsUpdate = true
        if (allDead) {
          scene.remove(particles)
          particles.geometry.dispose()
          return false
        }
        return true
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      renderer.dispose()
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement)
    }
  }, [removeBlockFromScene])

  // Socket.io connection
  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('identify', { type: 'projector' })
    })

    socket.on('disconnect', () => setIsConnected(false))

    socket.on('game_state', (state: { blocks: Block[]; score: number; lineHealth: number }) => {
      blocksRef.current.forEach((_, id) => removeBlockFromScene(id))
      state.blocks.forEach(block => createBlockMesh(block))
      setScore(state.score)
      setLineHealth(state.lineHealth)
    })

    socket.on('block_spawned', (block: Block) => createBlockMesh(block))

    socket.on('block_destroyed', (data: { blockId: string; points: number; position: { x: number; y: number; z: number } }) => {
      const mesh = blocksRef.current.get(data.blockId)
      const color = mesh ? BLOCK_CONFIGS[mesh.userData.blockType]?.color || 0x8B5A2B : 0x8B5A2B
      createExplosion(data.position, color)
      removeBlockFromScene(data.blockId)
    })

    socket.on('update_score', (data: { score: number; combo?: number }) => {
      setScore(data.score)
      if (data.combo) setCombo(data.combo)
    })

    socket.on('line_damaged', (data: { health: number }) => {
      setLineHealth(data.health)
    })

    socket.on('game_over', () => setGameStarted(false))

    socket.on('game_started', () => {
      setGameStarted(true)
      blocksRef.current.forEach((_, id) => removeBlockFromScene(id))
      setScore(0)
      setCombo(0)
      setLineHealth(100)
    })

    return () => socket.disconnect()
  }, [createBlockMesh, removeBlockFromScene, createExplosion])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setShowUI(false)
    } else {
      document.exitFullscreen()
      setShowUI(true)
    }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      
      {showUI && (
        <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <div className="flex justify-between items-start">
            <div className="p-4 pointer-events-auto" style={{ background: 'rgba(0,0,0,0.7)', border: '4px solid #000' }}>
              <div className="text-xs text-gray-400 mb-1">ОЧКИ</div>
              <div className="text-4xl text-cyan-400" style={{ textShadow: '2px 2px 0 #000' }}>{score}</div>
              {combo > 1 && <div className="text-lg text-yellow-400 mt-2">COMBO x{combo}</div>}
            </div>
            <div className="p-4 pointer-events-auto" style={{ background: 'rgba(0,0,0,0.7)', border: '4px solid #000' }}>
              <div className="text-xs text-gray-400 mb-1">ЗАЩИТА</div>
              <div className="w-32 h-4 bg-gray-800 border-2 border-gray-600">
                <div className="h-full transition-all" style={{ width: `${lineHealth}%`, background: lineHealth > 50 ? '#4ade80' : lineHealth > 25 ? '#fbbf24' : '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="p-8 text-center" style={{ fontFamily: '"Press Start 2P", monospace', background: 'rgba(0,0,0,0.9)', border: '4px solid #4AEDD9' }}>
            <h1 className="text-3xl mb-4" style={{ color: '#4AEDD9', textShadow: '3px 3px 0 #000' }}>MINECRAFT</h1>
            <h2 className="text-xl mb-8" style={{ color: '#5D8C3E', textShadow: '2px 2px 0 #000' }}>BLOCK BREAKER</h2>
            <div className="text-sm text-gray-400 mb-6">{isConnected ? '✅ Подключено' : '⏳ Подключение...'}</div>
            <div className="flex flex-col gap-4">
              <Button onClick={() => socketRef.current?.emit('start_game')} disabled={!isConnected} className="px-8 py-6 text-lg" style={{ fontFamily: '"Press Start 2P", monospace', background: '#5D8C3E' }}>НАЧАТЬ ИГРУ</Button>
              <Button onClick={toggleFullscreen} variant="outline" className="px-8 py-4 text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>ПОЛНЫЙ ЭКРАН</Button>
            </div>
            <div className="mt-6 text-xs text-gray-500">Подключите телефон для управления</div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 px-3 py-1 text-xs" style={{ fontFamily: '"Press Start 2P", monospace', background: isConnected ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: `2px solid ${isConnected ? '#4ade80' : '#ef4444'}`, color: isConnected ? '#4ade80' : '#ef4444' }}>
        {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
      </div>
    </div>
  )
}
