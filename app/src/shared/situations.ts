export type Situation = {
  id: number
  groupId: number
  title: string
  description: string
  comment: string
  fen: string
  sortOrder: number
}

export type SituationGroup = {
  id: number
  name: string
  sortOrder: number
  situations: Situation[]
}

export function findSituation(
  groups: SituationGroup[],
  situationId: number | null
): Situation | undefined {
  if (situationId === null) {
    return undefined
  }
  return groups
    .flatMap((group) => group.situations)
    .find((situation) => situation.id === situationId)
}

export function firstSituation(groups: SituationGroup[]): Situation | undefined {
  return groups[0]?.situations[0]
}

export type SituationsApi = {
  list: () => Promise<SituationGroup[]>
}
