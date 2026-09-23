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
    title: 'Основы',
    situations: [
      {
        id: 'center-control',
        title: 'Контроль центра',
        description: 'Займите центр пешками — так фигуры получат больше свободы.',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
      },
      {
        id: 'piece-development',
        title: 'Развитие фигур',
        description: 'Выводите коней и слонов к центру, не гонитесь за пешками.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
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
      },
      {
        id: 'smothered-mate',
        title: 'Спёртый мат',
        description: 'Конь ставит мат королю, запертому своими фигурами.',
        fen: '6rk/6pp/8/4N3/8/1Q6/8/6K1 w - - 0 1'
      },
      {
        id: 'ladder-mate',
        title: 'Мат двумя ладьями',
        description: 'Две ладьи оттесняют короля к краю — лестница.',
        fen: '4k3/R7/1R6/8/8/8/8/4K3 w - - 0 1'
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
      },
      {
        id: 'insufficient-material',
        title: 'Ничья: недостаточно материала',
        description: 'Одними королями мат не поставить — ничья.',
        fen: '8/8/8/8/8/8/8/K6k w - - 0 1'
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
      },
      {
        id: 'double-check',
        title: 'Двойной шах',
        description: 'Шах дают сразу две фигуры — закрыться одной фигурой нельзя.',
        fen: '7k/8/8/4N3/8/8/1B6/6K1 w - - 0 1'
      },
      {
        id: 'skewer',
        title: 'Сквозной удар',
        description: 'Нападение на фигуру, за которой стоит более ценная.',
        fen: 'q7/8/8/k7/8/8/7K/1R6 w - - 0 1'
      },
      {
        id: 'discovered-attack',
        title: 'Открытое нападение',
        description: 'Уход фигуры открывает удар другой фигуры по цели.',
        fen: 'k6q/8/8/8/3N4/8/1B6/6K1 w - - 0 1'
      },
      {
        id: 'pawn-fork',
        title: 'Вилка пешкой',
        description: 'Пешка нападает сразу на две фигуры.',
        fen: '7k/8/8/1n1n4/8/8/2P5/6K1 w - - 0 1'
      }
    ]
  }
]

export function findSituation(id: string): Situation | undefined {
  return SITUATION_GROUPS.flatMap((group) => group.situations).find(
    (situation) => situation.id === id
  )
}
