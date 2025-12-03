import { DatabaseSync, SQLOutputValue } from "node:sqlite"
import { paginateBackwards, paginateForward } from "../pagination.ts"

export function getSeizures(
  db: DatabaseSync,
  {
    first,
    after,
    last,
    before,
  }: {
    first?: number
    after?: number
    last?: number
    before?: number
  } = {},
): {
  err: false | string
  results: Record<string, SQLOutputValue>[] | undefined
  hasMore: boolean
} {
  try {
    const table =
      "substances JOIN seizures ON substances.seizure_id = seizures.id"
    const select =
      "substances.id, substances.name as substance, substances.amount, seizures.seized_on as seizedOn, seizures.reported_on as reportedOn"
    const idColumn = "substances.id"

    if (last) {
      return paginateBackwards({
        db,
        table,
        idColumn,
        select,
        last,
        before: before || -1,
      }) as {
        err: false | string
        results: Record<string, SQLOutputValue>[] | undefined
        hasMore: boolean
      }
    }

    return paginateForward({
      db,
      table,
      idColumn,
      select,
      first: first || 50,
      after: after || 0,
    }) as {
      err: false | string
      results: Record<string, SQLOutputValue>[] | undefined
      hasMore: boolean
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined, hasMore: false }
    } else {
      return { err: String(e), results: undefined, hasMore: false }
    }
  }
}
