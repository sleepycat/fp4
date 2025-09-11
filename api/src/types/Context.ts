import type { YogaInitialContext } from "npm:graphql-yoga"
import type { AllowListChecker } from "../allowList.ts"
import type { DatabaseSync } from "node:sqlite"
import { EmailPersonalisation } from "npm:notifications-node-client"
import type { DataAccessors } from "../db.ts"
import type { JwtFunctions } from "../useEncryptedJWT.ts"

type SendMagicLink = (
  emailAddress: string,
  variables: EmailPersonalisation,
) => Promise<unknown>

export interface Context extends YogaInitialContext {
  isAllowed: AllowListChecker
  db: DatabaseSync
  saveHash: DataAccessors["saveHash"]
  findOrCreateUser: DataAccessors["findOrCreateUser"]
  deleteHash: DataAccessors["deleteHash"]
  consumeMagicLink: DataAccessors["consumeMagicLink"]
  decrypt: JwtFunctions["decrypt"]
  encrypt: JwtFunctions["encrypt"]
  sendMagicLink: SendMagicLink
}
