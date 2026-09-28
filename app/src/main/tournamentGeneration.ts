import type { AbsenceScoring, DrawScoring, PairResult } from '../shared/tournament'

export type SwapSettings = {
  weakerPlaysWhite: boolean
  drawScoring: DrawScoring
  absenceScoring: AbsenceScoring
}

export type GenerationPairInput = {
  player1Id: number
  player2Id: number | null
  result: PairResult | null
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

export type GenerationResting = { playerId: number; boardNo: number }

export type GenerationResult = {
  pairs: GeneratedPair[]
  resting: GenerationResting[]
}

export function swapFor(result: PairResult, settings: SwapSettings): boolean {
  if (result === 'both_absent') {
    return false
  }
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

export function orderFor(input: GenerationInput): number[] {
  const roster = input.players
  if (input.seq === 1 || input.prevRound === null) {
    return [...roster]
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.id - b.id)
      .map((player) => player.id)
  }
  const rosterIds = new Set(roster.map((player) => player.id))
  const order: number[] = []
  for (const pair of input.prevRound.pairs) {
    if (pair.player2Id === null || pair.result === null) {
      if (rosterIds.has(pair.player1Id)) {
        order.push(pair.player1Id)
      }
      continue
    }
    const upperFirst = !swapFor(pair.result, input.prevRound.settings)
    const slots = upperFirst ? [pair.player1Id, pair.player2Id] : [pair.player2Id, pair.player1Id]
    for (const slot of slots) {
      if (rosterIds.has(slot)) {
        order.push(slot)
      }
    }
  }
  return order
}

function pairUp(order: number[], seq: number): GenerationResult {
  const pairs: GeneratedPair[] = []
  const resting: GenerationResting[] = []
  let index = 0
  if (seq % 2 === 0 && order.length > 0) {
    resting.push({ playerId: order[0], boardNo: 0 })
    index = 1
  }
  while (index + 1 < order.length) {
    pairs.push({ player1Id: order[index], player2Id: order[index + 1] })
    index += 2
  }
  let tailBoardNo = pairs.length + 1
  while (index < order.length) {
    resting.push({ playerId: order[index], boardNo: tailBoardNo })
    tailBoardNo += 1
    index += 1
  }
  return { pairs, resting }
}
