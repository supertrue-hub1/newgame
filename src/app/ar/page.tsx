'use client'

import { useState, useEffect } from 'react'

export default function ARGamePage() {
  const [showGame, setShowGame] = useState(false)
  const [gameUrl, setGameUrl] = useState('')

  useEffect(() => {
    // Get current base URL
    setGameUrl(window.location.origin + '/ar')
  }, [])

  // Generate QR code URL
  const qrCodeUrl = gameUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(gameUrl)}`
    : ''

  if (showGame) {
    return (
      <div className="fixed inset-0 bg-black">
        <button
          onClick={() => setShowGame(false)}
          className="absolute top-4 left-4 z-50 px-4 py-2 text-xs bg-black/80 border-2 border-white text-white rounded-lg"
        >
          ← Назад
        </button>
        <iframe 
          src="/ar-marker-game.html" 
          className="w-full h-full border-0"
          allow="camera; microphone"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-500 flex flex-col items-center justify-center p-4">
      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-4 text-center" style={{ textShadow: '2px 2px 0 #000' }}>
        MINECRAFT AR
      </h1>
      
      {/* Instructions */}
      <div className="bg-black/70 rounded-xl p-4 mb-4 max-w-md text-white text-center">
        <h2 className="text-lg font-bold text-yellow-400 mb-2">Как играть:</h2>
        <ol className="text-sm space-y-1 text-left list-decimal list-inside">
          <li>Отсканируйте QR-код на телефоне</li>
          <li>Распечатайте маркер (или покажите на экране)</li>
          <li>Нажмите "ИГРАТЬ" на телефоне</li>
          <li>Разрешите камеру</li>
          <li>Наведите на маркер</li>
          <li>Тапайте по блокам!</li>
        </ol>
      </div>
      
      {/* HIRO Marker - Proper AR.js marker */}
      <div className="bg-white p-4 rounded-lg shadow-xl mb-4">
        <p className="text-center text-gray-600 text-sm mb-2">
          📋 МАРКЕР HIRO (для печати)
        </p>
        
        {/* Real HIRO marker from AR.js */}
        <img 
          src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" 
          alt="Hiro Marker"
          width="250"
          height="250"
          className="border-4 border-black mx-auto"
        />
        
        <p className="text-center text-gray-500 text-xs mt-2">
          Это стандартный маркер AR.js
        </p>
      </div>
      
      {/* Print button */}
      <button
        onClick={() => {
          const win = window.open('', '_blank')
          if (win) {
            win.document.write(`
              <!DOCTYPE html>
              <html>
              <head><title>AR Marker - HIRO</title></head>
              <body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;font-family:Arial;">
                <p style="margin-bottom:20px;font-size:16px;">Наведите камеру на этот маркер:</p>
                <svg width="300" height="300" viewBox="0 0 16 16" style="border:4px solid #000">
                  <rect width="16" height="16" fill="white"/>
                  <rect x="1" y="1" width="14" height="14" fill="black"/>
                  <rect x="2" y="2" width="12" height="12" fill="white"/>
                  <g fill="black">
                    <rect x="3" y="3" width="1" height="4"/>
                    <rect x="5" y="3" width="1" height="4"/>
                    <rect x="3" y="4.5" width="3" height="1"/>
                    <rect x="7" y="3" width="1" height="4"/>
                    <rect x="9" y="3" width="1" height="4"/>
                    <rect x="10" y="3" width="1.5" height="1"/>
                    <rect x="10" y="4" width="1" height="0.5"/>
                    <rect x="10.5" y="5" width="0.5" height="2"/>
                    <rect x="12" y="3" width="2" height="4"/>
                    <rect x="12.5" y="3.5" width="1" height="3" fill="white"/>
                    <rect x="3" y="8" width="2" height="2"/>
                    <rect x="6" y="8" width="2" height="2"/>
                    <rect x="9" y="8" width="2" height="2"/>
                    <rect x="12" y="8" width="1" height="2"/>
                    <rect x="3" y="11" width="1" height="2"/>
                    <rect x="5" y="11" width="2" height="1"/>
                    <rect x="8" y="11" width="2" height="2"/>
                    <rect x="11" y="11" width="2" height="2"/>
                  </g>
                </svg>
                <p style="margin-top:20px;font-size:12px;color:#666;">AR.js HIRO Marker</p>
                <script>setTimeout(()=>window.print(), 500);</script>
              </body>
              </html>
            `)
            win.document.close()
          }
        }}
        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg mb-4 font-bold"
      >
        🖨️ ПЕЧАТЬ МАРКЕРА
      </button>
      
      {/* Print both Marker + QR */}
      {gameUrl && (
        <button
          onClick={() => {
            const win = window.open('', '_blank')
            if (win) {
              win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Minecraft AR - Маркер и QR код</title>
                  <style>
                    body { font-family: Arial; margin: 0; padding: 20px; text-align: center; }
                    .container { display: flex; justify-content: center; align-items: center; gap: 50px; flex-wrap: wrap; }
                    .item { text-align: center; }
                    h2 { margin-bottom: 10px; }
                    @media print { body { padding: 0; } }
                  </style>
                </head>
                <body>
                  <h1>🎮 MINECRAFT AR</h1>
                  <div class="container">
                    <div class="item">
                      <h2>📷 Маркер</h2>
                      <p style="font-size:12px;color:#666;margin-bottom:10px;">Наведите камеру на маркер:</p>
                      <img src="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" width="250" style="border:4px solid #000"/>
                    </div>
                    <div class="item">
                      <h2>📱 QR код</h2>
                      <p style="font-size:12px;color:#666;margin-bottom:10px;">Отсканируйте для игры:</p>
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(gameUrl)}" width="250"/>
                    </div>
                  </div>
                  <script>setTimeout(()=>window.print(), 500);</script>
                </body>
                </html>
              `)
              win.document.close()
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mb-4 font-bold"
        >
          🖨️ ПЕЧАТЬ МАРКЕРА + QR
        </button>
      )}
      
      {/* Play button */}
      <button
        onClick={() => setShowGame(true)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg"
      >
        🎮 ИГРАТЬ
      </button>
      
      {/* QR Code for mobile */}
      {gameUrl && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-xl">
          <p className="text-center text-gray-700 text-sm mb-2 font-bold">
            📱 СКАНИРУЙТЕ ДЛЯ ИГРЫ НА ТЕЛЕФОНЕ
          </p>
          <img 
            src={qrCodeUrl}
            alt="QR Code для игры"
            width="250"
            height="250"
            className="mx-auto"
          />
          <p className="text-center text-gray-500 text-xs mt-2">
            Отсканируйте и играйте!
          </p>
          
          {/* Download QR */}
          <button
            onClick={() => {
              const link = document.createElement('a')
              link.href = qrCodeUrl
              link.download = 'minecraft-ar-qr.png'
              link.click()
            }}
            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            ⬇️ СКАЧАТЬ QR-КОД
          </button>
          
          {/* Direct link */}
          <a 
            href={gameUrl}
            target="_blank"
            className="mt-2 block text-blue-600 underline text-sm"
          >
            🔗 Открыть ссылку
          </a>
        </div>
      )}
      
      {/* Tips */}
      <div className="mt-6 bg-black/50 rounded-lg p-3 max-w-sm text-white text-sm">
        <p className="font-bold text-yellow-400 mb-1">💡 Советы:</p>
        <ul className="text-xs space-y-1">
          <li>• Хорошее освещение = лучшее распознавание</li>
          <li>• Держите телефон на расстоянии 20-30 см</li>
          <li>• Можно показать маркер на мониторе</li>
        </ul>
      </div>
      
      {/* Alternative marker */}
      <div className="mt-4 text-center">
        <p className="text-white/80 text-xs mb-2">
          Или используйте готовый HIRO маркер:
        </p>
        <a 
          href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png"
          target="_blank"
          className="text-yellow-300 underline text-sm"
        >
          📥 Скачать официальный HIRO маркер
        </a>
      </div>
    </div>
  )
}
