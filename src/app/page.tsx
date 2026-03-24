'use client'

import { useState } from 'react'
import Link from 'next/link'

const pixelFont = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
`

export default function Home() {
  const [showGame, setShowGame] = useState(false)

  return (
    <>
      <style>{pixelFont}</style>
      <div 
        className="min-h-screen flex flex-col"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #5D8C3E 55%, #4A7A2E 100%)',
          imageRendering: 'pixelated',
        }}
      >
        {/* Decorative clouds */}
        <div className="absolute top-10 left-10 w-24 h-8 bg-white opacity-80" style={{clipPath: 'polygon(0 50%, 10% 0, 30% 0, 40% 50%, 50% 0, 70% 0, 80% 50%, 90% 0, 100% 50%, 100% 100%, 0 100%)'}} />
        <div className="absolute top-20 right-20 w-32 h-10 bg-white opacity-80" style={{clipPath: 'polygon(0 50%, 10% 0, 30% 0, 40% 50%, 50% 0, 70% 0, 80% 50%, 90% 0, 100% 50%, 100% 100%, 0 100%)'}} />
        
        {/* Sun */}
        <div className="absolute top-8 right-1/4 w-16 h-16 bg-yellow-400" style={{boxShadow: '0 0 30px #FFD700'}} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-16">
          {/* Title */}
          <div 
            className="mb-8 p-6"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: '4px solid #000',
            }}
          >
            <h1 
              className="text-2xl md:text-4xl text-center"
              style={{
                color: '#4AEDD9',
                textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
              }}
            >
              MINECRAFT
            </h1>
            <h2 
              className="text-lg md:text-2xl text-center mt-2"
              style={{
                color: '#5D8C3E',
                textShadow: '2px 2px 0 #000',
              }}
            >
              BLOCK CATCH
            </h2>
          </div>

          {/* Game Mode Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-md px-4">
            
            {/* AR Mode - Highlighted */}
            <Link href="/ar" className="w-full">
              <button
                className="w-full px-8 py-5 text-sm md:text-base text-white hover:scale-105 transition-transform active:scale-95 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: '4px solid #b45309',
                  boxShadow: '0 4px 0 #92400e, 4px 4px 0 #000',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div className="flex flex-col">
                    <span>AR РЕЖИМ</span>
                    <span className="text-xs opacity-80">Камера + Маркер</span>
                  </div>
                </div>
                <div 
                  className="absolute top-1 right-1 px-2 py-0.5 text-xs"
                  style={{
                    background: '#ef4444',
                    borderRadius: '4px',
                    fontSize: '8px',
                  }}
                >
                  NEW!
                </div>
              </button>
            </Link>

            {/* Single Player */}
            <button
              onClick={() => setShowGame(true)}
              className="w-full px-8 py-5 text-sm md:text-base text-white hover:scale-105 transition-transform active:scale-95"
              style={{
                background: '#5D8C3E',
                border: '4px solid #3D6B24',
                boxShadow: '0 4px 0 #2D4A1A, 4px 4px 0 #000',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🎮</span>
                <span>ОДИНОЧНАЯ ИГРА</span>
              </div>
            </button>

            {/* Multiplayer - Projector */}
            <Link href="/projector" className="w-full">
              <button
                className="w-full px-8 py-5 text-sm md:text-base text-white hover:scale-105 transition-transform active:scale-95"
                style={{
                  background: '#3B82F6',
                  border: '4px solid #2563EB',
                  boxShadow: '0 4px 0 #1D4ED8, 4px 4px 0 #000',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📺</span>
                  <span>ПРОЕКТОР (3D)</span>
                </div>
              </button>
            </Link>

            {/* Multiplayer - Phone */}
            <Link href="/phone" className="w-full">
              <button
                className="w-full px-8 py-5 text-sm md:text-base text-white hover:scale-105 transition-transform active:scale-95"
                style={{
                  background: '#8B5CF6',
                  border: '4px solid #7C3AED',
                  boxShadow: '0 4px 0 #6D28D9, 4px 4px 0 #000',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📱</span>
                  <span>КОНТРОЛЛЕР</span>
                </div>
              </button>
            </Link>
          </div>

          {/* Instructions */}
          <div 
            className="mt-8 p-4 text-xs text-center max-w-md"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '3px solid rgba(0,0,0,0.8)',
              color: '#fff',
            }}
          >
            <p className="text-amber-400 mb-2">📱 AR режим:</p>
            <p className="mb-4">Наведите камеру на маркер!</p>
            
            <p className="text-green-400 mb-2">🎮 Одиночная:</p>
            <p className="mb-4">Ловите блоки на экране</p>
            
            <p className="text-blue-400 mb-2">📺📱 Мультиплеер:</p>
            <p>Проектор + Телефон = Игра вместе!</p>
          </div>
        </div>
        
        {/* Footer */}
        <div 
          className="p-4 text-center text-xs"
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: '#888',
          }}
        >
          AR GAME 2024
        </div>
      </div>

      {/* Single Player Game Modal */}
      {showGame && (
        <iframe 
          src="/single-player" 
          className="fixed inset-0 z-50 w-full h-full border-0"
        />
      )}
      
      {/* Close button for single player */}
      {showGame && (
        <button
          onClick={() => setShowGame(false)}
          className="fixed top-4 left-4 z-[60] px-4 py-2 text-xs"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            background: 'rgba(0,0,0,0.8)',
            border: '2px solid #fff',
            color: '#fff',
          }}
        >
          ← ВЫХОД
        </button>
      )}
    </>
  )
}
