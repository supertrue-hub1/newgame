import { NextResponse } from 'next/server'

// Промокоды и призы
const PRIZES = [
  { code: 'MINECRAFT20', discount: 20, description: 'Скидка 20% на все товары' },
  { code: 'DIAMOND10', discount: 10, description: 'Скидка 10% на выбранные товары' },
  { code: 'BLOCK15', discount: 15, description: 'Скидка 15% на первый заказ' },
  { code: 'ARGAME25', discount: 25, description: 'Скидка 25% на товары со скидкой' },
  { code: 'CREEPER5', discount: 5, description: 'Скидка 5% на любой заказ' },
]

export async function GET() {
  // Возвращаем случайный промокод
  const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)]
  
  return NextResponse.json({
    success: true,
    prize: {
      code: randomPrize.code,
      discount: randomPrize.discount,
      description: randomPrize.description,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 дней
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { score, blocksCollected, gameDuration } = body
    
    // Логика определения приза на основе результатов
    let prize = PRIZES[0] // Базовый приз
    
    if (score >= 20) {
      prize = PRIZES[3] // ARGAME25
    } else if (score >= 15) {
      prize = PRIZES[0] // MINECRAFT20
    } else if (score >= 10) {
      prize = PRIZES[2] // BLOCK15
    }
    
    // Генерируем уникальный код с суффиксом
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const uniqueCode = `${prize.code}-${uniqueSuffix}`
    
    return NextResponse.json({
      success: true,
      prize: {
        code: uniqueCode,
        discount: prize.discount,
        description: prize.description,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stats: {
          score,
          blocksCollected,
          gameDuration,
        }
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}
