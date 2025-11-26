import type { DatabaseSync } from "node:sqlite"

export type PaginateForward = ReturnType<typeof paginateForward>

export function paginateForward(
  { first, after, table = "seizures", db }: {
    db: DatabaseSync
    table: "seizures" | "users"
    first: number
    after: number
  },
) {
  try {
    const results = db.prepare(
      // value of table is never supplied by the user
      `SELECT * FROM ${table} WHERE id > @after ORDER BY id ASC LIMIT @limit;`,
    ).all({ limit: first + 1, after })

    const hasMore = results.length > first
    if (hasMore) {
      results.pop()
    }

    return { err: false, results, hasMore }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined, hasMore: false }
    } else {
      return { err: String(e), results: undefined, hasMore: false }
    }
  }
}

export function paginateBackwards(
  { last, before, table = "seizures", db }: {
    last: number
    before: number
    table: "seizures" | "users"
    db: DatabaseSync
  },
) {
  try {
    const results = db.prepare(
      // value of table is never supplied by the user
      `SELECT * FROM ${table} WHERE id < @before ORDER BY id DESC LIMIT @limit;`,
    ).all({ limit: last + 1, before })

    const hasMore = results.length > last
    if (hasMore) {
      results.pop()
    }

    return { err: false, results: results.reverse(), hasMore }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined, hasMore: false }
    } else {
      return { err: String(e), results: undefined, hasMore: false }
    }
  }
}
