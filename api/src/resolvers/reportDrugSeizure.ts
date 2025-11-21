import { Context } from "../types/Context.ts"

type DrugSeizureRecord = {
  substance: string
  seizedOn: string
  reportedOn: string
  amount: number
}
export function reportDrugSeizure(
  _parent: undefined,
  { input }: { input: DrugSeizureRecord },
  { db, authenticatedUser }: Context,
) {
  if (authenticatedUser) {
    console.log({
      authenticated: true,
      payload: authenticatedUser,
    })
    const response = db.addSeizure({
      user_id: authenticatedUser.user_id,
      substance: input.substance,
      amount: input.amount,
      seized_on: input.seizedOn,
      reported_on: input.reportedOn,
    })
    console.log({ input, response })
    return "👍"
  } else {
    console.log({ authenticated: false, public: true })
    return "not logged in. Public access only."
  }
}
