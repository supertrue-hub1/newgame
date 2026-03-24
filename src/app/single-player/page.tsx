'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Volume2, VolumeX, X } from 'lucide-react'

// Block types with Minecraft-style colors
const BLOCK_TYPES = [
  { name: 'dirt', label: 'Земля', points: 1, bg: '#8B5A2B', border: '#6B4423' },
  { name: 'grass', label: 'Трава', points: 1, bg: '#5D8C3E', border: '#3D5C2E' },
  { name: 'stone', label: 'Камень', points: 1, bg: '#7D7D7D', border: '#5A5A5A' },
  { name: 'wood', label: 'Дерево', points: 1, bg: '#9C7653', border: '#7A5C3F' },
  { name: 'coal', label: 'Уголь', points: 2, bg: '#3D3D3D', border: '#2A2A2A' },
  { name: 'gold', label: 'Золото', points: 3, bg: '#FFD700', border: '#DAA520', glow: true },
  { name: 'diamond', label: 'Алмаз', points: 5, bg: '#4AEDD9', border: '#2DD4BF', glow: true, rare: true },
]

interface Block {
  id: number
  type: typeof BLOCK_TYPES[0]
  x: number
  y: number
  velocity: number
  rotation: number
}

const pixelFont = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`

function MinecraftTerrain() {
  return (
    <div className="absolute bottom-0 left-0 right-0" style={{ imageRendering: 'pixelated', height: 80 }}>
      <div className="absolute top-0 left-0 right-0 h-6" style={{
        background: 'linear-gradient(180deg, #6B8E23 0%, #567D46 50%, #4A6B3A 100%)',
        borderBottom: '4px solid #3D5C2E',
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2)',
      }}>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="absolute bottom-0" style={{
              left: `${i * 2.5}%`, width: '3px', height: `${4 + (i % 4) * 2}px`,
              background: `linear-gradient(180deg, ${['#7CBA3D', '#6B8E23', '#567D46'][i % 3]} 0%, transparent 100%)`,
            }} />
          ))}
        </div>
      </div>
      <div className="absolute left-0 right-0" style={{
        top: 24, height: 56,
        background: 'linear-gradient(180deg, #8B5A2B 0%, #7A4A1F 30%, #6B4423 60%, #5A3A1A 100%)',
      }}>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div key={`b-${i}`} className="absolute" style={{
              left: `${(i * 3.3) % 100}%`, top: `${(i * 7) % 100}%`,
              width: '3px', height: '3px',
              backgroundColor: i % 2 === 0 ? '#6B4423' : '#9C7653', opacity: 0.5,
            }} />
          ))}
          {[...Array(15)].map((_, i) => (
            <div key={`g-${i}`} className="absolute" style={{
              left: `${(i * 6.7) % 100}%`, top: `${(i * 13) % 100}%`,
              width: '2px', height: '2px',
              backgroundColor: '#5A5A5A', opacity: 0.5,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SinglePlayerGame() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'win'>('menu')
  const [score, setScore] = useState(0)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scorePop, setScorePop] = useState(false)

  const gameRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const blockIdRef = useRef(0)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => audioContextRef.current?.close()
  }, [])

  const playSound = useCallback((type: 'pop' | 'win' | 'click') => {
    if (!soundEnabled || !audioContextRef.current) return
    const ctx = audioContextRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    if (type === 'pop') {
      osc.type = 'square'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.type = 'square'
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2)
        o.start(ctx.currentTime + i * 0.1)
        o.stop(ctx.currentTime + i * 0.1 + 0.2)
      })
    } else {
      osc.type = 'square'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    }
  }, [soundEnabled])

  const createParticles = useCallback((x: number, y: number, color: string, border: string) => {
    if (!gameRef.current) return
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div')
      p.className = 'absolute pointer-events-none'
      p.style.cssText = `left:${x}px;top:${y}px;width:6px;height:6px;background:${color};border:1px solid ${border};z-index:100;`
      gameRef.current.appendChild(p)
      const angle = (Math.PI * 2 / 16) * i
      let vx = Math.cos(angle) * 60, vy = Math.sin(angle) * 60 - 60, px = x, py = y, op = 1
      const anim = () => {
        vy += 4; px += vx * 0.02; py += vy * 0.02; op -= 0.025
        p.style.left = `${px}px`; p.style.top = `${py}px`; p.style.opacity = op.toString()
        if (op > 0) { requestAnimationFrame(anim) } else { p.remove() }
      }
      requestAnimationFrame(anim)
    }
  }, [])

  const spawnBlock = useCallback(() => {
    const weights = [30, 25, 20, 15, 6, 3, 1]
    let r = Math.random() * weights.reduce((a, b) => a + b), idx = 0
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break } }
    const type = BLOCK_TYPES[idx]
    const w = gameRef.current?.clientWidth || 400
    setBlocks(prev => [...prev, { id: blockIdRef.current++, type, x: Math.random() * (w - 70) + 35, y: -60, velocity: 1.2 + Math.random() * 0.3, rotation: Math.random() * 20 - 10 }])
  }, [])

  const handleBlockClick = useCallback((block: Block, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, block.type.bg, block.type.border)
    playSound('pop')
    clearTimeout(comboTimeoutRef.current!)
    setCombo(prev => { const c = prev + 1; if (c >= 2) { setShowCombo(true); setTimeout(() => setShowCombo(false), 600) } return c })
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 1000)
    const pts = block.type.points * Math.min(combo + 1, 5)
    setScorePop(true); setTimeout(() => setScorePop(false), 150)
    setScore(prev => { const s = prev + pts; if (s >= 10) setTimeout(() => setGameState('win'), 300); return s })
    setBlocks(prev => prev.filter(b => b.id !== block.id))
  }, [combo, createParticles, playSound])

  useEffect(() => {
    if (gameState !== 'playing') { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current); return }
    const h = gameRef.current?.clientHeight || 600
    const loop = () => {
      setBlocks(prev => prev.map(b => ({ ...b, y: b.y + b.velocity + (score * 0.01) })).filter(b => b.y < h - 120))
      gameLoopRef.current = requestAnimationFrame(loop)
    }
    gameLoopRef.current = requestAnimationFrame(loop)
    spawnBlock()
    spawnIntervalRef.current = setInterval(spawnBlock, 1200)
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current) }
  }, [gameState, spawnBlock, score])

  const startGame = useCallback(() => {
    playSound('click')
    setGameState('playing'); setScore(0); setCombo(0); setBlocks([]); blockIdRef.current = 0
    if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume()
  }, [playSound])

  useEffect(() => {
    if (gameState === 'win') {
      playSound('win')
      fetch('/api/prize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score }) })
        .then(r => r.json()).then(d => d.success && setPromoCode(d.prize.code)).catch(() => setPromoCode('MINECRAFT-2024'))
    }
  }, [gameState, score, playSound])

  if (gameState === 'menu') {
    return (
      <>
        <style>{pixelFont}</style>
        <div className="min-h-screen flex flex-col" style={{ fontFamily: '"Press Start 2P", monospace', background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #5D8C3E 55%, #4A7A2E 100%)' }}>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="mb-6 p-4" style={{ background: 'rgba(0,0,0,0.7)', border: '4px solid #000' }}>
              <h1 className="text-2xl text-center" style={{ color: '#4AEDD9', textShadow: '3px 3px 0 #000' }}>MINECRAFT</h1>
              <h2 className="text-lg text-center mt-2" style={{ color: '#5D8C3E', textShadow: '2px 2px 0 #000' }}>BLOCK CATCH</h2>
            </div>
            <div className="flex gap-2 mb-6">
              {BLOCK_TYPES.slice(0, 5).map(t => <div key={t.name} className="w-10 h-10" style={{ backgroundColor: t.bg, border: `3px solid ${t.border}` }} />)}
            </div>
            <button onClick={startGame} className="px-8 py-4 text-sm text-white hover:scale-105 active:scale-95" style={{ background: '#5D8C3E', border: '4px solid #3D6B24', boxShadow: '0 4px 0 #2D4A1A' }}>▶ ИГРАТЬ</button>
            <div className="mt-4 p-3 text-xs" style={{ background: 'rgba(0,0,0,0.6)', border: '3px solid #000', color: '#fff' }}>
              <p>Ловите блоки! Соберите 10 очков!</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (gameState === 'win') {
    return (
      <>
        <style>{pixelFont}</style>
        <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: '"Press Start 2P", monospace', background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d5a 100%)' }}>
          <div className="p-6 max-w-md w-full text-center" style={{ background: 'rgba(0,0,0,0.8)', border: '4px solid #4AEDD9' }}>
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl mb-4" style={{ color: '#FFD700', textShadow: '2px 2px 0 #000' }}>ПОБЕДА!</h2>
            <div className="text-white text-sm mb-4">Очков: {score}</div>
            <div className="text-gray-400 text-xs mb-2">Промокод:</div>
            <div className="p-4 mb-4" style={{ background: '#1a1a2e', border: '3px solid #4AEDD9' }}>
              <div className="text-lg" style={{ color: '#4AEDD9' }}>{promoCode || '...'}</div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={startGame} className="px-6 py-3 text-xs text-white" style={{ background: '#5D8C3E', border: '3px solid #3D6B24' }}>ЗАНОВО</button>
              <button onClick={() => setGameState('menu')} className="px-6 py-3 text-xs text-white" style={{ background: '#666', border: '3px solid #444' }}>В МЕНЮ</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{pixelFont}</style>
      <div ref={gameRef} className="fixed inset-0 overflow-hidden cursor-pointer" style={{ fontFamily: '"Press Start 2P", monospace', background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #87CEEB 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-8 w-12 h-12 bg-yellow-400" style={{ boxShadow: '0 0 20px #FFD700' }} />
        </div>
        {blocks.map(b => (
          <div key={b.id} onClick={e => handleBlockClick(b, e)} onTouchStart={e => handleBlockClick(b, e)} className="absolute cursor-pointer" style={{ left: b.x - 28, top: b.y, transform: `rotate(${b.rotation}deg)` }}>
            <div className={`relative ${b.type.rare ? 'animate-pulse' : ''}`} style={{ width: 56, height: 56 }}>
              <div className="absolute inset-0" style={{ backgroundColor: b.type.bg, border: `4px solid ${b.type.border}`, boxShadow: b.type.glow ? `0 0 20px ${b.type.bg}` : 'inset 2px 2px 0 rgba(255,255,255,0.2)' }} />
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/20" />
            </div>
          </div>
        ))}
        <MinecraftTerrain />
        <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="p-3 pointer-events-auto" style={{ background: 'rgba(0,0,0,0.7)', border: '3px solid #000' }}>
              <div className="text-xs text-gray-400 mb-1">ОЧКИ</div>
              <div className={`text-2xl ${scorePop ? 'scale-125' : ''} transition-transform`} style={{ color: '#4AEDD9', textShadow: '2px 2px 0 #000' }}>{score}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSoundEnabled(!setSoundEnabled)} className="p-2 pointer-events-auto" style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid #000' }}>
                {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
          </div>
          {showCombo && <div className="absolute top-20 left-1/2 -translate-x-1/2 text-lg" style={{ color: '#FFD700', textShadow: '2px 2px 0 #000' }}>COMBO x{combo}!</div>}
        </div>
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-xs px-4 py-2" style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)', color: '#fff' }}>ЦЕЛЬ: 10 ОЧКОВ</div>
      </div>
    </>
  )
}
