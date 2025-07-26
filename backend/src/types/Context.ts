import type { YogaInitialContext } from "npm:graphql-yoga"
import { allowList } from "../allowList.ts"

export interface Context extends YogaInitialContext {
  isAllowed: ReturnType<typeof allowList>
}
