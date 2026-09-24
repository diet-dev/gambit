import type { CSSProperties } from 'react'
import type { GameStatus, PossibleMove } from './rules'

export const SELECTED_SQUARE_STYLE: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 0, 0.4)'
}

export const CHECKED_KING_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, transparent 35%, rgba(255, 0, 0, 0.75) 65%, rgba(255, 0, 0, 0.75) 100%)'
}

export function moveStyle(isCapture: boolean): CSSProperties {
  return {
    backgroundImage: isCapture
      ? 'radial-gradient(circle, transparent 55%, rgba(0, 0, 0, 0.2) 56%)'
      : 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 22%, transparent 23%)'
  }
}

export function statusText(status: GameStatus): string {
  switch (status.kind) {
    case 'turn':
      return status.turn === 'w' ? 'Ход белых' : 'Ход чёрных'
    case 'check':
      return status.turn === 'w' ? 'Шах белым!' : 'Шах чёрным!'
    case 'checkmate':
      return status.winner === 'w' ? 'Мат! Победа белых' : 'Мат! Победа чёрных'
    case 'stalemate':
      return 'Пат — ничья'
    case 'draw':
      switch (status.reason) {
        case 'insufficient-material':
          return 'Ничья: недостаточно материала'
        case 'threefold-repetition':
          return 'Ничья: троекратное повторение'
        case 'fifty-moves':
          return 'Ничья: правило 50 ходов'
      }
  }
}

export function statusBarClassName(status: GameStatus): string {
  return status.kind === 'checkmate' ? 'status-bar status-bar-checkmate' : 'status-bar'
}

export function squareStylesFor(state: {
  selectedSquare: string | null
  possibleMoves: PossibleMove[]
  checkedSquare: string | null
}): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {}
  if (state.selectedSquare) {
    styles[state.selectedSquare] = SELECTED_SQUARE_STYLE
  }
  for (const move of state.possibleMoves) {
    styles[move.square] = moveStyle(move.isCapture)
  }
  if (state.checkedSquare) {
    styles[state.checkedSquare] = CHECKED_KING_STYLE
  }
  return styles
}
