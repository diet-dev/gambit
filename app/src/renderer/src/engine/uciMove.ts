export type UciMove = {
  from: string
  to: string
  promotion?: string
}

const UCI_MOVE = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/

export function parseUciMove(uci: string): UciMove | null {
  const match = UCI_MOVE.exec(uci)

  if (!match) {
    return null
  }

  const [, from, to, promotion] = match

  return promotion ? { from, to, promotion } : { from, to }
}
