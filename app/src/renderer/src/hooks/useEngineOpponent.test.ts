import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEngineOpponent } from './useEngineOpponent'
import { type Engine } from '../engine/stockfish'

const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'

function createFakeEngine(): { engine: Engine; resolveMove: (uci: string) => void } {
  let resolveMove: (uci: string) => void = () => undefined
  const engine: Engine = {
    setSkillLevel: vi.fn().mockResolvedValue(undefined),
    findBestMove: vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveMove = resolve
        })
    ),
    dispose: vi.fn()
  }

  return { engine, resolveMove: (uci: string) => resolveMove(uci) }
}

function setup(overrides: Partial<Parameters<typeof useEngineOpponent>[0]> = {}): {
  result: { current: ReturnType<typeof useEngineOpponent> }
  engine: Engine
  resolveMove: (uci: string) => void
  playMove: ReturnType<typeof vi.fn>
} {
  const { engine, resolveMove } = createFakeEngine()
  const playMove = vi.fn().mockReturnValue(true)
  const { result } = renderHook(() =>
    useEngineOpponent({
      enabled: true,
      fen: FEN,
      turn: 'b',
      isGameOver: false,
      playMove,
      getEngine: () => engine,
      ...overrides
    })
  )

  return { result, engine, resolveMove, playMove }
}

describe('useEngineOpponent', () => {
  it('asks the engine for a move and plays it on the black turn', async () => {
    const { result, engine, resolveMove, playMove } = setup()

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledWith(FEN))
    expect(result.current.isThinking).toBe(true)

    act(() => {
      resolveMove('e7e5')
    })

    await waitFor(() => expect(playMove).toHaveBeenCalledWith({ from: 'e7', to: 'e5' }))
    await waitFor(() => expect(result.current.isThinking).toBe(false))
  })

  it('parses a promotion move', async () => {
    const { engine, resolveMove, playMove } = setup({ turn: 'b' })

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalled())
    act(() => {
      resolveMove('a2a1q')
    })

    await waitFor(() =>
      expect(playMove).toHaveBeenCalledWith({ from: 'a2', to: 'a1', promotion: 'q' })
    )
  })

  it('does nothing when disabled', () => {
    const { engine } = setup({ enabled: false })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })

  it('does nothing on the white turn', () => {
    const { engine } = setup({ turn: 'w' })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })

  it('does nothing when the game is over', () => {
    const { engine } = setup({ isGameOver: true })

    expect(engine.findBestMove).not.toHaveBeenCalled()
  })
})
