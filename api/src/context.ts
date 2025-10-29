import type { YogaInitialContext } from "graphql-yoga"
import type { DatabaseSync } from "node:sqlite"
import { EmailPersonalisation, NotifyClient } from "notifications-node-client"
import { dataAccessors } from "./db.ts"
import { useEncryptedJWT } from "./useEncryptedJWT.ts"
import { allowList } from "./allowList.ts"
import type { Context } from "./types/Context.ts"

interface ContextDeps {
  db: DatabaseSync
  jwtSecret: string
  jwtIssuer: string
  allowedDomains: string
  notifyApiKey: string
  notifyTemplateId: string
}

export function createContext(
  deps: ContextDeps,
) {
  const dbAccess = dataAccessors(deps.db)
  const jwt = useEncryptedJWT({
    base64secret: deps.jwtSecret,
    enforce: { issuer: deps.jwtIssuer, audience: "fp4" },
  })
  const isAllowed = allowList(deps.allowedDomains)
  const notifyClient = new NotifyClient(
    "https://api.notification.canada.ca",
    deps.notifyApiKey,
  )

  return function contextFactory(initialContext: YogaInitialContext): Context {
    return {
      ...initialContext,
      db: dbAccess,
      // Pass the whole jwt object
      jwt,
      isAllowed,
      sendMagicLink(address: string, variables: EmailPersonalisation) {
        return notifyClient.sendEmail(deps.notifyTemplateId, address, {
          personalisation: variables,
        })
      },
    }
  }
}
