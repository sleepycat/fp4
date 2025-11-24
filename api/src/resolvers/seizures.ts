import type { Context } from "../types/Context.ts"

export function seizures(
  _root: undefined,
  _args: undefined,
  { db }: Context,
) {
  const results = db.getSeizures()
  return results.results
}
