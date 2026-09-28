import type { DatabaseSync } from 'node:sqlite'
import type { Situation, SituationGroup } from '../shared/situations'

export type SituationStore = {
  list: () => SituationGroup[]
}

export function createSituationStore(database: DatabaseSync): SituationStore {
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

  return { list }
}
