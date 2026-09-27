import type { AbsenceScoring, DrawScoring, PairResult } from '../shared/tournament'

export type SwapSettings = {
  weakerPlaysWhite: boolean
  drawScoring: DrawScoring
  absenceScoring: AbsenceScoring
}

export type GenerationPairInput = {
  player1Id: number
  player2Id: number
  result: PairResult
}

export type GenerationInput = {
  seq: number
  players: { id: number; lastName: string }[]
  prevRound: null | {
    seq: number
    settings: SwapSettings
    pairs: GenerationPairInput[]
  }
}

export type GeneratedPair = { player1Id: number; player2Id: number }

export type GenerationResult = {
  pairs: GeneratedPair[]
  restingPlayerId: number | null
}

export function swapFor(result: PairResult, settings: SwapSettings): boolean {
  if (result === 'draw') {
    return settings.drawScoring === 'weaker'
  }
  if (settings.absenceScoring === 'no_effect') {
    return false
  }
  const whiteIsPlayer2 = settings.weakerPlaysWhite
  const whiteWon = whiteIsPlayer2
    ? result === 'player2_win' || result === 'player1_absent'
    : result === 'player1_win' || result === 'player2_absent'
  return whiteWon === settings.weakerPlaysWhite
}

export function generateRound(input: GenerationInput): GenerationResult {
  const order = orderFor(input)
  return pairUp(order, input.seq)
}

function orderFor(input: GenerationInput): number[] {
  if (input.seq === 1 || input.prevRound === null) {
    return [...input.players]
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.id - b.id)
      .map((player) => player.id)
  }
  const { prevRound } = input
  const order: number[] = []
  for (const pair of prevRound.pairs) {
    if (swapFor(pair.result, prevRound.settings)) {
      order.push(pair.player2Id, pair.player1Id)
    } else {
      order.push(pair.player1Id, pair.player2Id)
    }
  }
  const paired = new Set(order)
  const resting = input.players.map((player) => player.id).find((id) => !paired.has(id))
  if (resting !== undefined) {
    if (prevRound.seq % 2 === 0) {
      order.unshift(resting)
    } else {
      order.push(resting)
    }
  }
  return order
}

function pairUp(order: number[], seq: number): GenerationResult {
  const pairs: GeneratedPair[] = []
  const resting: number[] = []
  let index = 0
  if (seq % 2 === 0 && order.length > 0) {
    resting.push(order[0])
    index = 1
  }
  while (index + 1 < order.length) {
    pairs.push({ player1Id: order[index], player2Id: order[index + 1] })
    index += 2
  }
  if (index < order.length) {
    resting.push(order[index])
  }
  return { pairs, restingPlayerId: resting[0] ?? null }
}
