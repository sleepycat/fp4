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
      `SELECT * FROM ${table} WHERE id > @after ORDER BY id ASC LIMIT @first;`,
    ).all({ first, after })
    return { err: false, results }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined }
    } else {
      return { err: String(e), results: undefined }
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
      `SELECT * FROM ${table} WHERE id < @before ORDER BY id DESC LIMIT @last;`,
    ).all({ last, before })
    return { err: false, results: results.reverse() }
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { err: e.message, results: undefined }
    } else {
      return { err: String(e), results: undefined }
    }
  }
}
