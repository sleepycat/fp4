import { DatabaseSync } from "node:sqlite"

export function getSeizureSummary(
  db: DatabaseSync,
) {
  try {
    return db.prepare(
      "SELECT substances.name as substance, sum(substances.amount) as total, strftime('%m-%Y', seizures.seized_on) AS month FROM substances JOIN seizures ON substances.seizure_id = seizures.id GROUP BY substance, month ORDER BY month, substance;",
    ).all()
  } catch (e) {
    // TODO: do better here.
    console.error({ rollback: true, error: e })
    return undefined
  }
}
