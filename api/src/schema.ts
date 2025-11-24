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
  typeDefs: [
    /* GraphQL */ `
    scalar EmailAddress
    scalar ULID
    scalar ISO8601Date
    scalar PositiveFloat

    type DrugSeizureRecord {
      substance: String
      seizedOn: ISO8601Date
      reportedOn: ISO8601Date
      amount: PositiveFloat
    }

    type Query {
      hello: String
      seizures: [DrugSeizureRecord]
    }

    input DrugSeizureInput {
      substance: String!
      seizedOn: ISO8601Date!
      reportedOn: ISO8601Date!
      amount: PositiveFloat!
    }

    type Mutation {
      reportDrugSeizure(input: DrugSeizureInput): String
      # Provide an email address to log in via magic links
      login(email: EmailAddress!): String
      # Verify the token you recieved to create a session.
      verify(token: ULID!): String
    }
  `,
  ],
  resolvers: {
    ISO8601Date,
    EmailAddress: EmailAddressResolver,
    ULID: ULIDResolver,
    PositiveFloat: PositiveFloatResolver,
    DrugSeizureRecord: {
      // these exist because the column name has an underscore and the GraphQL schema is camelcase.
      seizedOn: (parent) => parent.seized_on,
      reportedOn: (parent) => parent.reported_on,
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
