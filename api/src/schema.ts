import { createSchema } from "graphql-yoga"
import {
  EmailAddressResolver,
  PositiveFloatResolver,
  ULIDResolver,
} from "graphql-scalars"
import { ISO8601Date } from "./ISO8601Date.ts"
import { seizures } from "./resolvers/seizures.ts"
import { verify } from "./resolvers/verify.ts"
import { login } from "./resolvers/login.ts"
import { reportDrugSeizure } from "./resolvers/reportDrugSeizure.ts"
import { authenticatedOnly } from "./authenticatedOnly.ts"

export const schema = createSchema({
  typeDefs: await Deno.readTextFile(
    new URL("../schema.graphql", import.meta.url),
  ),
  resolvers: {
    ISO8601Date,
    EmailAddress: EmailAddressResolver,
    ULID: ULIDResolver,
    PositiveFloat: PositiveFloatResolver,
    DrugSeizureRecord: {
      id: (parent) => {
        // @ts-ignore: toBase64 is actually a property of TextEncoder
        return new TextEncoder().encode(`seizures/${parent.id}`).toBase64({
          alphabet: "base64url",
        })
      },
    },
    Mutation: {
      // NB: we're choosing a specific name here, instead of something generic
      // like "reportSeizure" (of what?) or just "report" (anything?). The more
      // generic the name is, the more likely you are to run into another usage
      // of the term later... causing conflicts and likely deprecations.
      reportDrugSeizure: authenticatedOnly(reportDrugSeizure),
      login,
      verify,
    },
    Query: {
      hello: () => "world",
      seizures: authenticatedOnly(seizures),
    },
  },
})
