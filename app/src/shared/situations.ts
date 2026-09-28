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

export type SituationCreateInput = {
  groupId?: number
  groupName?: string
  title: string
  description: string
  comment: string
  fen: string
}

export type SituationUpdateInput = {
  id: number
  groupId?: number
  groupName?: string
  title: string
  description: string
  comment: string
}

export function normalizeHeadingInput(value: string): string {
  const collapsed = value.replace(/\s{2,}/g, ' ')
  const first = collapsed.charAt(0).toLocaleUpperCase('ru')
  return first + collapsed.slice(1)
}

export function finalizeHeadingText(value: string): string {
  return normalizeHeadingInput(value.trim())
}

export type SituationsApi = {
  list: () => Promise<SituationGroup[]>
  create: (input: SituationCreateInput) => Promise<Situation>
  update: (input: SituationUpdateInput) => Promise<Situation>
  remove: (id: number) => Promise<void>
}
