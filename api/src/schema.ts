import { createSchema } from "graphql-yoga"
import {
  EmailAddressResolver,
  PositiveFloatResolver,
  ULIDResolver,
  JSONResolver,
} from "graphql-scalars"
import { ISO8601Date } from "./ISO8601Date.ts"
import { ReportingYear } from "./ReportingYear.ts"
import { seizures } from "./resolvers/seizures.ts"
import { seizureStatistics } from "./resolvers/seizureStatistics.ts"
import { verify } from "./resolvers/verify.ts"
import { login } from "./resolvers/login.ts"
import { reportDrugSeizure } from "./resolvers/reportDrugSeizure.ts"
import { authenticatedOnly } from "./authenticatedOnly.ts"
import { loggedIn } from "./resolvers/loggedIn.ts"

export const schema = createSchema({
  typeDefs: await Deno.readTextFile(
    "schema.graphql",
  ),
  resolvers: {
    ISO8601Date,
    EmailAddress: EmailAddressResolver,
    ULID: ULIDResolver,
    PositiveFloat: PositiveFloatResolver,
    ReportingYear,
    JSON: JSONResolver,
    SeizureStatistic: {
      id: (parent) => {
        // @ts-ignore: toBase64 is actually a property of TextEncoder
        return new TextEncoder().encode(`${parent.year}-${parent.month}-${parent.drugType}`).toBase64({
          alphabet: "base64url",
        })
      },
    },
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
      loggedIn,
      seizures: authenticatedOnly(seizures),
      seizureStatistics, // Unauthenticated: Summary data intended for public consumption
    },
  },
})
