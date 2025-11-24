import { GraphQLResolveInfo } from "graphql"
import type { Context } from "./Context.ts"

// The Generic Resolver Type
export type Resolver<A, P> = (
  parent: P,
  args: A,
  context: Context,
  info: GraphQLResolveInfo,
) => unknown
