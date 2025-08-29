import type { YogaInitialContext } from "npm:graphql-yoga"
import { allowList } from "../allowList.ts"
import type { DatabaseSync, SQLOutputValue, StatementSync } from "node:sqlite"
import { EmailPersonalisation } from "npm:notifications-node-client"
import { StatementResultingChanges } from "node:sqlite"
import type { JwtFunctions } from "../useEncryptedJWT.ts"

type FindOrCreateUser = (
  email: string,
) => Record<string, SQLOutputValue> | undefined

type SendMagicLink = (
  emailAddress: string,
  variables: EmailPersonalisation,
) => Promise<unknown>

interface saveHashArguments {
  hash: string
  email: string
}

type SaveHash = (
  options: saveHashArguments,
) => Record<string, SQLOutputValue> | undefined

type DeletionResult = {
  err: unknown
  results: Record<string, unknown>
}

type ConsumeMagicLink = (
  hash: string,
) => {
  err: false | string
  results: Record<string, SQLOutputValue> | undefined
}

type DeleteHash = (
  email: string,
) => DeletionResult

export interface Context extends YogaInitialContext {
  isAllowed: ReturnType<typeof allowList>
  sql: (
    strings: TemplateStringsArray,
    ...values: (string | number)[]
  ) => StatementSync
  db: DatabaseSync
  findOrCreateUser: FindOrCreateUser
  saveHash: SaveHash
  deleteHash: DeleteHash
  sendMagicLink: SendMagicLink
  consumeMagicLink: ConsumeMagicLink
  decrypt: JwtFunctions["decrypt"]
  encrypt: JwtFunctions["encrypt"]
}
