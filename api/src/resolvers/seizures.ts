import type { Context } from "../types/Context.ts"
import { GraphQLError } from "graphql"

export function seizures(
  _root: undefined,
  _args: undefined,
  { db, authenticatedUser }: Context,
) {
  if (authenticatedUser) {
    const results = db.getSeizures()
    return results.results
  } else {
    throw new GraphQLError(
      "Authentication required to access this resource.",
      {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 401 },
        },
      },
    )
  }
}
