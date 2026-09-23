export type Situation = {
  id: string
  title: string
  description: string
  fen: string
}

export type SituationGroup = {
  title: string
  situations: Situation[]
}

export const DEFAULT_SITUATION_ID = 'start'

export const SITUATION_GROUPS: SituationGroup[] = [
  {
    title: 'Начало',
    situations: [
      {
        id: 'start',
        title: 'Начальная позиция',
        description: 'Классическое начало игры. Белые ходят первыми.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      }
    ]
  },
  {
    title: 'Маты',
    situations: [
      {
        id: 'mate-in-one',
        title: 'Мат в один ход',
        description: 'Найдите ход, который сразу ставит мат.',
        fen: '6k1/5ppp/8/8/8/8/8/4Q1K1 w - - 0 1'
      },
      {
        id: 'fool-mate',
        title: 'Детский мат',
        description: 'Как чёрные матуют за два хода: 1.f3 e5 2.g4 Фh4#.',
        fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
      },
      {
        id: 'legal-mate',
        title: 'Мат Легаля',
        description: 'Классическая ловушка в дебюте.',
        fen: 'rn1q1bnr/ppp1kB1p/3p2p1/3NN3/4P3/8/PPPP1PPP/R1BbK2R b KQ - 2 7'
      }
    ]
  },
  {
    title: 'Правила',
    situations: [
      {
        id: 'castling',
        title: 'Рокировка',
        description: 'Король и ладья могут рокироваться, если путь свободен.',
        fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
      },
      {
        id: 'en-passant',
        title: 'Взятие на проходе',
        description: 'Пешка может взять пешку, перепрыгнувшую через поле.',
        fen: 'rnbqkb1r/ppp1pppp/5n2/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3'
      },
      {
        id: 'promotion',
        title: 'Превращение пешки',
        description: 'Пешка на предпоследней горизонтали становится ферзём.',
        fen: '8/P7/8/8/8/8/8/k6K w - - 0 1'
      },
      {
        id: 'stalemate',
        title: 'Пат',
        description: 'У чёрных нет ходов, но нет и шаха — ничья.',
        fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'
      }
    ]
  },
  {
    title: 'Приёмы',
    situations: [
      {
        id: 'pin',
        title: 'Связка',
        description: 'Конь прикрывает короля и не может уйти.',
        fen: '4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1'
      },
      {
        id: 'knight-fork',
        title: 'Вилка конём',
        description: 'Конь нападает сразу на короля и ладью.',
        fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'
      },
      {
        id: 'discovered-check',
        title: 'Открытый шах',
        description: 'Уход слона открывает шах ладьёй.',
        fen: '4k3/8/8/8/8/8/4B3/4R1K1 w - - 0 1'
      }
    ]
  }
]

export function findSituation(id: string): Situation | undefined {
  return SITUATION_GROUPS.flatMap((group) => group.situations).find(
    (situation) => situation.id === id
  )
}
