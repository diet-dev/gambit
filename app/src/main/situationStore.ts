import type { DatabaseSync } from 'node:sqlite'
import type { Situation, SituationCreateInput, SituationGroup } from '../shared/situations'
import { finalizeHeadingText } from '../shared/situations'

export type SituationStore = {
  list: () => SituationGroup[]
  create: (input: SituationCreateInput) => Situation
}

export function createSituationStore(database: DatabaseSync): SituationStore {
  function withTransaction<T>(run: () => T): T {
    database.exec('BEGIN')
    try {
      const result = run()
      database.exec('COMMIT')
      return result
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }

  function list(): SituationGroup[] {
    const groups = database
      .prepare(
        `SELECT id, name, sort_order AS sortOrder
         FROM situation_groups ORDER BY sort_order, id`
      )
      .all() as unknown as Omit<SituationGroup, 'situations'>[]
    const situations = database
      .prepare(
        `SELECT id, group_id AS groupId, title, description, comment, fen, sort_order AS sortOrder
         FROM situations ORDER BY sort_order, id`
      )
      .all() as unknown as Situation[]
    return groups.map((group) => ({
      ...group,
      situations: situations.filter((situation) => situation.groupId === group.id)
    }))
  }

  function create(input: SituationCreateInput): Situation {
    return withTransaction(() => {
      const title = finalizeHeadingText(input.title)
      if (title === '') {
        throw new Error('Введите название ситуации')
      }
      const description = finalizeHeadingText(input.description)
      const comment = finalizeHeadingText(input.comment)

      const existingByFen = database
        .prepare('SELECT title FROM situations WHERE fen = ?')
        .get(input.fen) as { title: string } | undefined
      if (existingByFen !== undefined) {
        throw new Error(`Позиция уже сохранена: «${existingByFen.title}»`)
      }

      let groupId = input.groupId ?? null
      let groupName = ''
      if (groupId === null) {
        groupName = finalizeHeadingText(input.groupName ?? '')
        if (groupName === '') {
          throw new Error('Введите название группы или выберите существующую')
        }
        const sameGroup = database
          .prepare('SELECT id, name FROM situation_groups WHERE name = ? COLLATE NOCASE')
          .get(groupName) as { id: number; name: string } | undefined
        if (sameGroup !== undefined) {
          throw new Error(`Группа с таким именем уже есть: «${sameGroup.name}»`)
        }
        const lastSortOrder = database
          .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max FROM situation_groups')
          .get() as { max: number }
        const groupInfo = database
          .prepare('INSERT INTO situation_groups (name, sort_order) VALUES (?, ?)')
          .run(groupName, lastSortOrder.max + 1)
        groupId = Number(groupInfo.lastInsertRowid)
      } else {
        const group = database
          .prepare('SELECT name FROM situation_groups WHERE id = ?')
          .get(groupId) as { name: string } | undefined
        if (group === undefined) {
          throw new Error('Выбранная группа не найдена')
        }
        groupName = group.name
      }

      const sameTitle = database
        .prepare('SELECT id FROM situations WHERE group_id = ? AND title = ?')
        .get(groupId, title)
      if (sameTitle !== undefined) {
        throw new Error(`В группе «${groupName}» уже есть ситуация с таким названием`)
      }
      const lastSortOrder = database
        .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max FROM situations WHERE group_id = ?')
        .get(groupId) as { max: number }
      const info = database
        .prepare(
          `INSERT INTO situations (group_id, title, description, comment, fen, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(groupId, title, description, comment, input.fen, lastSortOrder.max + 1)

      return {
        id: Number(info.lastInsertRowid),
        groupId,
        title,
        description,
        comment,
        fen: input.fen,
        sortOrder: lastSortOrder.max + 1
      }
    })
  }

  return { list, create }
}
