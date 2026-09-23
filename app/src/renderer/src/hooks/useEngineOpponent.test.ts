import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEngineOpponent } from './useEngineOpponent'
import { type Engine } from '../engine/stockfish'

const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'

function createFakeEngine(): {
  engine: Engine
  resolveMove: (uci: string, index?: number) => void
} {
  const resolvers: ((uci: string) => void)[] = []
  const engine: Engine = {
    setSkillLevel: vi.fn().mockResolvedValue(undefined),
    findBestMove: vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve)
        })
    ),
    dispose: vi.fn()
  }

  return {
    engine,
    resolveMove: (uci: string, index = resolvers.length - 1) => resolvers[index](uci)
  }
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

  it('requests a new move when re-enabled on the same fen', async () => {
    const { engine } = createFakeEngine()
    const playMove = vi.fn().mockReturnValue(true)
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useEngineOpponent({
          enabled,
          fen: FEN,
          turn: 'b',
          isGameOver: false,
          playMove,
          getEngine: () => engine
        }),
      { initialProps: { enabled: false } }
    )

    expect(engine.findBestMove).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledTimes(1))

    rerender({ enabled: false })
    rerender({ enabled: true })
    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledTimes(2))
  })

  it('clears thinking when the search rejects', async () => {
    const engine: Engine = {
      setSkillLevel: vi.fn().mockResolvedValue(undefined),
      findBestMove: vi.fn(async () => {
        throw new Error('engine failed')
      }),
      dispose: vi.fn()
    }
    const { result } = renderHook(() =>
      useEngineOpponent({
        enabled: true,
        fen: FEN,
        turn: 'b',
        isGameOver: false,
        playMove: vi.fn().mockReturnValue(true),
        getEngine: () => engine
      })
    )

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalled())
    await waitFor(() => expect(result.current.isThinking).toBe(false))
  })

  it('ignores a stale move when the fen changed before it resolved', async () => {
    const { engine, resolveMove } = createFakeEngine()
    const playMove = vi.fn().mockReturnValue(true)
    const { rerender } = renderHook(
      ({ fen }: { fen: string }) =>
        useEngineOpponent({
          enabled: true,
          fen,
          turn: 'b',
          isGameOver: false,
          playMove,
          getEngine: () => engine
        }),
      { initialProps: { fen: FEN } }
    )

    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledWith(FEN))

    const nextFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'
    rerender({ fen: nextFen })
    await waitFor(() => expect(engine.findBestMove).toHaveBeenCalledWith(nextFen))

    act(() => {
      resolveMove('e7e5', 0)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(playMove).not.toHaveBeenCalled()
  })

  it('does not throw when acquiring the engine fails', async () => {
    const getEngine = (): Engine => {
      throw new Error('worker failed')
    }
    const { result } = renderHook(() =>
      useEngineOpponent({
        enabled: true,
        fen: FEN,
        turn: 'b',
        isGameOver: false,
        playMove: vi.fn().mockReturnValue(true),
        getEngine
      })
    )

    await waitFor(() => expect(result.current.isThinking).toBe(false))
  })
})
