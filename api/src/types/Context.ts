import type { YogaInitialContext } from "graphql-yoga"
import type { AllowListChecker } from "../allowList.ts"
import { EmailPersonalisation } from "notifications-node-client"
import type { DataAccessors } from "../db.ts"
import type { JwtFunctions } from "../useEncryptedJWT.ts"

// TODO: Is this used somewhere?
// Probably this should live somewhere else or be deleted.
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
  authenticatedUser?: any
}

export type ContextFactory = (
  initialContext: YogaInitialContext,
) => Context | Promise<Context>
