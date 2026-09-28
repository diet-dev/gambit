import type { DatabaseSync } from 'node:sqlite'
import type {
  Situation,
  SituationCreateInput,
  SituationGroup,
  SituationUpdateInput
} from '../shared/situations'
import { finalizeHeadingText } from '../shared/situations'

export type SituationStore = {
  list: () => SituationGroup[]
  create: (input: SituationCreateInput) => Situation
  update: (input: SituationUpdateInput) => Situation
  remove: (id: number) => void
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

  function resolveGroup(
    inputGroupId: number | undefined,
    inputGroupName: string | undefined
  ): { id: number; name: string } {
    const groupId = inputGroupId ?? null
    if (groupId === null) {
      const groupName = finalizeHeadingText(inputGroupName ?? '')
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
      return { id: Number(groupInfo.lastInsertRowid), name: groupName }
    }
    const group = database
      .prepare('SELECT name FROM situation_groups WHERE id = ?')
      .get(groupId) as { name: string } | undefined
    if (group === undefined) {
      throw new Error('Выбранная группа не найдена')
    }
    return { id: groupId, name: group.name }
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

      const group = resolveGroup(input.groupId, input.groupName)

      const sameTitle = database
        .prepare('SELECT id FROM situations WHERE group_id = ? AND title = ?')
        .get(group.id, title)
      if (sameTitle !== undefined) {
        throw new Error(`В группе «${group.name}» уже есть ситуация с таким названием`)
      }
      const lastSortOrder = database
        .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max FROM situations WHERE group_id = ?')
        .get(group.id) as { max: number }
      const info = database
        .prepare(
          `INSERT INTO situations (group_id, title, description, comment, fen, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(group.id, title, description, comment, input.fen, lastSortOrder.max + 1)

      return {
        id: Number(info.lastInsertRowid),
        groupId: group.id,
        title,
        description,
        comment,
        fen: input.fen,
        sortOrder: lastSortOrder.max + 1
      }
    })
  }

  function update(input: SituationUpdateInput): Situation {
    return withTransaction(() => {
      const existing = database
        .prepare('SELECT fen, sort_order FROM situations WHERE id = ?')
        .get(input.id) as { fen: string; sort_order: number } | undefined
      if (existing === undefined) {
        throw new Error('Ситуация не найдена')
      }
      const title = finalizeHeadingText(input.title)
      if (title === '') {
        throw new Error('Введите название ситуации')
      }
      const description = finalizeHeadingText(input.description)
      const comment = finalizeHeadingText(input.comment)

      const group = resolveGroup(input.groupId, input.groupName)

      const sameTitle = database
        .prepare('SELECT id FROM situations WHERE group_id = ? AND title = ? AND id != ?')
        .get(group.id, title, input.id)
      if (sameTitle !== undefined) {
        throw new Error(`В группе «${group.name}» уже есть ситуация с таким названием`)
      }

      database
        .prepare(
          'UPDATE situations SET group_id = ?, title = ?, description = ?, comment = ? WHERE id = ?'
        )
        .run(group.id, title, description, comment, input.id)

      return {
        id: input.id,
        groupId: group.id,
        title,
        description,
        comment,
        fen: existing.fen,
        sortOrder: existing.sort_order
      }
    })
  }

  function remove(id: number): void {
    database.prepare('DELETE FROM situations WHERE id = ?').run(id)
  }

  return { list, create, update, remove }
}
