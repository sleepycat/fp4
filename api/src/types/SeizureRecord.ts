export type SeizedSubstance = {
  id: number
  name: string
  category:
    | "controlled substance"
    | "precursors"
    | "chemical offence-related property"
    | "cannabis"
    | "chemical property"
  amount: number
  unit:
    | "capsules"
    | "grams"
    | "kilograms"
    | "liters"
    | "micrograms"
    | "milligrams"
    | "milliliters"
    | "tablets"
}

export type SeizureRecord = {
  id: number
  reference: string
  location: string
  seizedOn: string
  reportedOn: string
  userId: number
  substances: SeizedSubstance[]
}

export type SeizedSubstanceInput = Omit<SeizedSubstance, "id">
export type SeizureRecordInput =
  & Omit<SeizureRecord, "id" | "substances">
  & {
    substances: SeizedSubstanceInput[]
  }
