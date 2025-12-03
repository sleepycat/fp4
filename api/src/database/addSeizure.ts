import { DatabaseSync } from "node:sqlite"
import type {
  SeizedSubstance,
  SeizureRecord,
  SeizureRecordInput,
} from "../types/SeizureRecord.ts"

export function addSeizure(
  db: DatabaseSync,
  record: SeizureRecordInput,
): {
  err: false | string
  results: SeizureRecord | undefined
} {
  try {
    db.exec("BEGIN TRANSACTION;")

    const seizure = db.prepare(
      "INSERT INTO seizures (reference, location, seized_on, reported_on, user_id) VALUES (@reference, @location, @seized_on, @reported_on, @user_id) RETURNING *;",
    ).get({
      reference: record.reference,
      location: record.location,
      seized_on: record.seizedOn,
      reported_on: record.reportedOn,
      user_id: record.userId,
    }) as unknown as SeizureRecord

    const substances = []
    for (const substance of record.substances) {
      const sub = db.prepare(
        "INSERT INTO substances (name, category, amount, unit, seizure_id) VALUES (@name, @category, @amount, @unit, @seizure_id) RETURNING *;",
      ).get({
        name: substance.name,
        category: substance.category,
        amount: substance.amount,
        unit: substance.unit,
        seizure_id: seizure!.id,
      })

      substances.push(sub)
    }

    db.exec("COMMIT;")
    seizure.substances = substances as SeizedSubstance[]

    return { err: false, results: seizure }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined }
    } else {
      return { err: String(e), results: undefined }
    }
  }
}
