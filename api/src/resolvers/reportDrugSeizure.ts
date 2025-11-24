import { Context } from "../types/Context.ts"

type DrugSeizureRecord = {
  substance: string
  seizedOn: string
  reportedOn: string
  amount: number
}
export function reportDrugSeizure(
  _parent: unknown,
  { input }: { input: DrugSeizureRecord },
  { db, authenticatedUser }: Context,
) {
  db.addSeizure({
    user_id: authenticatedUser!.user_id,
    substance: input.substance,
    amount: input.amount,
    seized_on: input.seizedOn,
    reported_on: input.reportedOn,
  })
  return "👍"
}
