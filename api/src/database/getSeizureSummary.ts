import { DatabaseSync } from "node:sqlite"

export function getSeizureSummary(
  db: DatabaseSync,
) {
  try {
    return db.prepare(
      "SELECT substance, sum(amount) as total, strftime('%m-%Y', seized_on) AS month FROM seizures GROUP BY substance, month ORDER BY month, substance;",
    ).all()
  } catch (e) {
    // TODO: do better here.
    console.error({ rollback: true, error: e })
    return undefined
  }
}
