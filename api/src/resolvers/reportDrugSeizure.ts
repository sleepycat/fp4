import { Context } from "../types/Context.ts"
import type { SeizureRecordInput } from "../types/SeizureRecord.ts"

export function reportDrugSeizure(
  _parent: unknown,
  { input }: { input: SeizureRecordInput },
  { db, authenticatedUser }: Context,
) {
  // TODO: do some actual error handling here.
  db.addSeizure({
    userId: authenticatedUser!.user_id,
    seizedOn: input.seizedOn,
    reportedOn: new Date().toLocaleDateString("en-CA"),
    location: input.location,
    substances: input.substances,
    reference: input.reference,
  })

  // TODO: return a seizure payload so forms can update/resubmit easily
  return "👍"
}
