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

  it('selects a piece and exposes its legal moves on click', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.onSquareClick({ square: 'e2' })
    })

    expect(result.current.selectedSquare).toBe('e2')
    expect(result.current.possibleMoves).toEqual([
      { square: 'e3', isCapture: false },
      { square: 'e4', isCapture: false }
    ])
  })

  it('moves the selected piece when a highlighted square is clicked', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.onSquareClick({ square: 'e2' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'e4' })
    })

    expect(result.current.position).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
    )
    expect(result.current.selectedSquare).toBeNull()
    expect(result.current.possibleMoves).toEqual([])
  })

  it('deselects when a square that is not a legal target is clicked', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.onSquareClick({ square: 'e2' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'a3' })
    })

    expect(result.current.selectedSquare).toBeNull()
    expect(result.current.possibleMoves).toEqual([])
  })

  it('reselects another own piece instead of moving', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.onSquareClick({ square: 'e2' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'd2' })
    })

    expect(result.current.selectedSquare).toBe('d2')
    expect(result.current.possibleMoves).toEqual([
      { square: 'd3', isCapture: false },
      { square: 'd4', isCapture: false }
    ])
  })

  it('flags capturing moves', () => {
    const { result } = renderHook(() => useChessGame('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1'))

    act(() => {
      result.current.onSquareClick({ square: 'e4' })
    })

    expect(result.current.possibleMoves).toContainEqual({ square: 'd5', isCapture: true })
  })

  it('clears the selection after a drop', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.onSquareClick({ square: 'e2' })
    })
    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })
    })

    expect(result.current.selectedSquare).toBeNull()
    expect(result.current.possibleMoves).toEqual([])
  })

  it('reports no check from the standard position', () => {
    const { result } = renderHook(() => useChessGame())

    expect(result.current.checkedSquare).toBeNull()
  })

  it('flags the king square when a move gives check', () => {
    const { result } = renderHook(() => useChessGame('4k3/8/8/8/8/8/8/R5K1 w - - 0 1'))

    act(() => {
      result.current.onSquareClick({ square: 'a1' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'a8' })
    })

    expect(result.current.checkedSquare).toBe('e8')
  })

  it('clears the check when the king moves out of it', () => {
    const { result } = renderHook(() => useChessGame('4k3/8/8/8/8/8/8/4R1K1 b - - 0 1'))

    expect(result.current.checkedSquare).toBe('e8')

    act(() => {
      result.current.onSquareClick({ square: 'e8' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'd8' })
    })

    expect(result.current.checkedSquare).toBeNull()
  })

  it('reports whose turn it is when there is no check', () => {
    const { result } = renderHook(() => useChessGame())

    expect(result.current.status).toEqual({ kind: 'turn', turn: 'w' })
  })

  it('reports check with the side to move', () => {
    const { result } = renderHook(() => useChessGame('4k3/8/8/8/8/8/8/R5K1 w - - 0 1'))

    act(() => {
      result.current.onSquareClick({ square: 'a1' })
    })
    act(() => {
      result.current.onSquareClick({ square: 'a8' })
    })

    expect(result.current.status).toEqual({ kind: 'check', turn: 'b' })
  })

  it('reports checkmate with the winner', () => {
    const { result } = renderHook(() =>
      useChessGame('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')
    )

    expect(result.current.status).toEqual({ kind: 'checkmate', winner: 'b' })
  })

  it('reports stalemate', () => {
    const { result } = renderHook(() => useChessGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))

    expect(result.current.status).toEqual({ kind: 'stalemate' })
  })

  it('reports a draw by insufficient material', () => {
    const { result } = renderHook(() => useChessGame('8/8/8/8/8/8/8/K6k w - - 0 1'))

    expect(result.current.status).toEqual({ kind: 'draw', reason: 'insufficient-material' })
  })

  it('reports a draw by the fifty-move rule', () => {
    const { result } = renderHook(() => useChessGame('8/8/8/4k3/8/4K3/6R1/8 w - - 100 200'))

    expect(result.current.status).toEqual({ kind: 'draw', reason: 'fifty-moves' })
  })

  it('reports a draw by threefold repetition', () => {
    const { result } = renderHook(() => useChessGame())

    const moves: [string, string][] = [
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8'],
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8']
    ]

    for (const [from, to] of moves) {
      act(() => {
        result.current.onSquareClick({ square: from })
      })
      act(() => {
        result.current.onSquareClick({ square: to })
      })
    }

    expect(result.current.status).toEqual({ kind: 'draw', reason: 'threefold-repetition' })
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
