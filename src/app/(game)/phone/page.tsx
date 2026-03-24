'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export default function PhoneControllerPage() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lastPoints, setLastPoints] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [lineHealth, setLineHealth] = useState(100)
  const [showPoints, setShowPoints] = useState(false)
  
  const socketRef = useRef<Socket | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Socket.io connection
  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Phone connected to game server')
      setIsConnected(true)
      socket.emit('identify', { type: 'phone' })
    })

    socket.on('disconnect', () => {
      console.log('Phone disconnected from game server')
      setIsConnected(false)
    })

    socket.on('update_score', (data: { score: number; combo?: number; points?: number }) => {
      setScore(data.score)
      if (data.combo !== undefined) setCombo(data.combo)
      if (data.points) {
        setLastPoints(data.points)
        setShowPoints(true)
        setTimeout(() => setShowPoints(false), 500)
      }
    })

    socket.on('update_health', (data: { health: number }) => {
      setLineHealth(data.health)
    })

    socket.on('game_over', () => {
      setGameStarted(false)
    })

    socket.on('game_started', () => {
      setGameStarted(true)
      setScore(0)
      setCombo(0)
      setLineHealth(100)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Handle tap
  const handleTap = useCallback(() => {
    if (!isConnected || !gameStarted) return

    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // Send break event
    socketRef.current?.emit('BREAK_BLOCK', {})

    // Visual feedback
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.95)'
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = 'scale(1)'
        }
      }, 50)
    }
  }, [isConnected, gameStarted])

  // Touch handlers for better mobile experience
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleTap()
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 select-none touch-none"
      style={{
        fontFamily: '"Press Start 2P", monospace',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 p-4 text-center"
        style={{
          background: 'rgba(0,0,0,0.5)',
          borderBottom: '2px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1 
          className="text-lg"
          style={{
            color: '#4AEDD9',
            textShadow: '2px 2px 0 #000',
          }}
        >
          MINECRAFT
        </h1>
        <h2 
          className="text-sm mt-1"
          style={{
            color: '#5D8C3E',
            textShadow: '1px 1px 0 #000',
          }}
        >
          CONTROLLER
        </h2>
      </div>

      {/* Connection Status */}
      <div 
        className="absolute top-20 right-4 px-2 py-1 text-xs"
        style={{
          background: isConnected ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `2px solid ${isConnected ? '#4ade80' : '#ef4444'}`,
          color: isConnected ? '#4ade80' : '#ef4444',
        }}
      >
        {isConnected ? '🟢' : '🔴'}
      </div>

      {/* Score Display */}
      <div 
        className="mb-8 p-6 text-center"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '4px solid #000',
        }}
      >
        <div className="text-xs text-gray-400 mb-2">СЧЁТ</div>
        <div 
          className="text-5xl"
          style={{
            color: '#4AEDD9',
            textShadow: '3px 3px 0 #000',
          }}
        >
          {score}
        </div>
        
        {/* Combo */}
        {combo > 1 && (
          <div 
            className="text-xl mt-2"
            style={{
              color: '#FFD700',
              textShadow: '2px 2px 0 #000',
            }}
          >
            COMBO x{combo}
          </div>
        )}

        {/* Points popup */}
        {showPoints && (
          <div 
            className="text-2xl text-green-400 mt-2 animate-bounce"
            style={{ textShadow: '2px 2px 0 #000' }}
          >
            +{lastPoints}
          </div>
        )}
      </div>

      {/* Health Bar */}
      <div 
        className="mb-8 w-64"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '4px solid #000',
          padding: '12px',
        }}
      >
        <div className="text-xs text-gray-400 mb-2 text-center">ЗАЩИТА</div>
        <div className="w-full h-6 bg-gray-800 border-2 border-gray-600">
          <div 
            className="h-full transition-all duration-200"
            style={{ 
              width: `${lineHealth}%`,
              background: lineHealth > 50 ? '#4ade80' : lineHealth > 25 ? '#fbbf24' : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* Main Tap Button */}
      {gameStarted ? (
        <button
          ref={buttonRef}
          onTouchStart={handleTouchStart}
          onClick={handleTap}
          disabled={!isConnected}
          className="w-64 h-64 rounded-full transition-all duration-75 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #5D8C3E 0%, #4A7A2E 50%, #3D6B24 100%)',
            border: '6px solid #2D4A1A',
            boxShadow: '0 8px 0 #1D3A10, 0 12px 20px rgba(0,0,0,0.5), inset 0 4px 0 rgba(255,255,255,0.2)',
            fontSize: '14px',
            color: 'white',
            textShadow: '2px 2px 0 #000',
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">⛏️</span>
            <span>TAP TO</span>
            <span>MINE!</span>
          </div>
        </button>
      ) : (
        <div 
          className="text-center p-8"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '4px solid #FFD700',
          }}
        >
          <div className="text-2xl mb-4">⏳</div>
          <div className="text-sm text-yellow-400">
            {isConnected ? 'Ожидание начала игры...' : 'Подключение...'}
          </div>
          <div className="text-xs text-gray-500 mt-4">
            Запустите игру на проекторе
          </div>
        </div>
      )}

      {/* Instructions */}
      <div 
        className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 px-4"
      >
        Нажимайте кнопку, чтобы ломать блоки!
      </div>
    </div>
  )
}
