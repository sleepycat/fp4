import { GraphQLResolveInfo } from "graphql"
import type { Context } from "./types/Context.ts"
import type { Resolver } from "./types/Resolver.ts"
import { GraphQLError } from "graphql"

export function authenticatedOnly<A, P>(
  resolver: Resolver<A, P>,
): Resolver<A, P> {
  return (
    parent: P,
    args: A,
    context: Context,
    info: GraphQLResolveInfo,
  ) => {
    if (!context.authenticatedUser) {
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
    return resolver(parent, args, context, info)
  }
}
