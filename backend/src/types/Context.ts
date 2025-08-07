import type { YogaInitialContext } from "npm:graphql-yoga"
import { allowList } from "../allowList.ts"
import type { DatabaseSync, SQLOutputValue, StatementSync } from "node:sqlite"

type FindOrCreateUser = (
  email: string,
) => Record<string, SQLOutputValue> | undefined

export interface Context extends YogaInitialContext {
  isAllowed: ReturnType<typeof allowList>
  sql: (
    strings: TemplateStringsArray,
    ...values: (string | number)[]
  ) => StatementSync
  db: DatabaseSync
  findOrCreateUser: FindOrCreateUser
}
