import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useChessGame } from './useChessGame'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('useChessGame', () => {
  it('starts from the standard position', () => {
    const { result } = renderHook(() => useChessGame())

    expect(result.current.position).toBe(START_FEN)
  })

  it('accepts a legal move and updates the position', () => {
    const { result } = renderHook(() => useChessGame())

    let accepted = false
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })
    })

    expect(accepted).toBe(true)
    expect(result.current.position).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    )
  })

  it('rejects an illegal move without changing the position', () => {
    const { result } = renderHook(() => useChessGame())

    let accepted = true
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e5' })
    })

    expect(accepted).toBe(false)
    expect(result.current.position).toBe(START_FEN)
  })

  it('rejects a drop outside the board', () => {
    const { result } = renderHook(() => useChessGame())

    let accepted = true
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: null })
    })

    expect(accepted).toBe(false)
    expect(result.current.position).toBe(START_FEN)
  })

  it('promotes a pawn to a queen', () => {
    const { result } = renderHook(() => useChessGame('8/P7/8/8/8/8/8/k6K w - - 0 1'))

    let accepted = false
    act(() => {
      accepted = result.current.onPieceDrop({ sourceSquare: 'a7', targetSquare: 'a8' })
    })

    expect(accepted).toBe(true)
    expect(result.current.position).toBe('Q7/8/8/8/8/8/8/k6K b - - 0 1')
  })
})
