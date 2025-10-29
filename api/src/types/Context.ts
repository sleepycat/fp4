import type { YogaInitialContext } from "graphql-yoga"
import type { AllowListChecker } from "../allowList.ts"
import { EmailPersonalisation } from "notifications-node-client"
import type { DataAccessors } from "../db.ts"
import type { JwtFunctions } from "../useEncryptedJWT.ts"

type SendMagicLink = (
  emailAddress: string,
  variables: EmailPersonalisation,
) => Promise<unknown>

export interface Context extends YogaInitialContext {
  isAllowed: AllowListChecker
  // The db property now correctly holds the data accessors
  db: DataAccessors
  jwt: JwtFunctions
  sendMagicLink: SendMagicLink
}
