import { Context } from "./types/Context.ts"
import { createSchema } from "graphql-yoga"
import { GraphQLError } from "graphql"
import {
  EmailAddressResolver,
  PositiveFloatResolver,
  ULIDResolver,
} from "graphql-scalars"
import { ISO8601Date } from "./ISO8601Date.ts"
import { monotonicUlid } from "@std/ulid"
import { isExpired } from "./isExpired.ts"
import { sha256 } from "./sha256.ts"

type User = {
  id: number
  email: string
  created_at: string
}

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
      reportDrugSeizure: (
        _parent,
        { input },
        { db, authenticatedUser }: Context,
      ) => {
        if (authenticatedUser) {
          console.log({
            authenticated: true,
            payload: authenticatedUser,
          })
          const response = db.addSeizure({
            user_id: authenticatedUser.user_id,
            substance: input.substance,
            amount: input.amount,
            seized_on: input.seizedOn,
            reported_on: input.reportedOn,
          })
          console.log({ input, response })
          return "👍"
        } else {
          console.log({ authenticated: false, public: true })
          return "not logged in. Public access only."
        }
      },
      login: async (
        _parent,
        { email },
        { db, isAllowed, sendMagicLink, rateLimiter }: Context,
      ) => {
        // Check rate limit for this email. Prevent griefing/spam.
        try {
          await rateLimiter.login.consume(email, 1)
        } catch (_e: unknown) {
          return new GraphQLError(
            "Rate limit exceeded. Too many requests.",
            {
              extensions: {
                code: "RATE_LIMITED",
                http: { status: 429 },
              },
            },
          )
        }

        const abiguousMessage =
          "If an account exists for this email, a login link has been sent."

        // Split user from domain and check if email is on allow-list: Check ALLOWED_DOMAINS env var. return generic message
        if (!isAllowed(email)) {
          // Return generic message to prevent user enumeration:
          return abiguousMessage
        }

        // Find or create user/email in sqlite
        const user = db.findOrCreateUser(email) as User

        // generate monotonic ulid (monotonicUlid) token: tokens generated at the same time are still different
        // ulid: embedded timestamp + 80 bits of randomness.
        // This allows us skip storing created_at/expires_at values.
        const ulid = monotonicUlid()
        // console.log({ email, ulid })
        const hash = await sha256(ulid)

        // Save hashed token (not the token) to sqlite.
        // This prevents leaks of tokens (assuming a breach of the database)
        // and serves as a record of the tokens we've issued.
        db.saveHash({ hash, user_id: user?.id })

        const _response = await sendMagicLink(email, { code: ulid })
        // console.log({ email, isAllowed: isAllowed(email), ulid, hash })
        // : Return generic message to prevent user enumeration:
        return abiguousMessage
      },
      verify: async (
        _parent,
        { token }: { token: string },
        { db, jwt, request, rateLimiter, remoteAddress },
      ) => {
        // remoteAddr will be here in production. If so, rate limit against that.
        if (remoteAddress) {
          // rate limit this function to prevent guessing.
          try {
            await rateLimiter.login.consume(remoteAddress, 1)
          } catch (_e: unknown) {
            return new GraphQLError(
              "Rate limit exceeded. Too many requests.",
              {
                extensions: {
                  code: "RATE_LIMITED",
                  http: { status: 429 },
                },
              },
            )
          }
        }

        // Create a SHA-256 Hash of token: we can store these without worrying about leakage.
        const hash = await sha256(token)

        // First check: Is this old/expired?

        // Stateless expiry check!
        // Ulids embed a timestamp along with some randomness.
        // That means that we can simply:
        // decodeTime(token) and reject if older than 15 minutes.
        if (isExpired({ token, minutesTillExpiry: 15 })) {
          // It's old.
          // just delete the old hash if one exists.
          db.deleteHash(hash)
          throw new GraphQLError(
            "Token expired.",
            {
              extensions: {
                code: "EXPIRED_TOKEN",
                http: { status: 401 },
              },
            },
          )
        }

        // Second check: Did we issue this token?

        // Look up hash in magic_links in transaction:
        // * no records == invalid: someone just made thier own ulid and sent it to us
        // * user_id returned == valid: we issued a token and stored the user id/hash
        // * immediately delete in same transation
        const { err, results } = db.consumeMagicLink(hash)
        if (err) {
          throw new GraphQLError(
            "Invalid token.",
            {
              extensions: {
                code: "INVALID_TOKEN",
                http: { status: 401 },
              },
            },
          )
        }
        // If we got here the token was:
        // 1) issued by us
        // 2) less than 15 minutes ago.

        // console.log({
        //   token,
        //   hash,
        //   results,
        // })

        // XXX: Align jwt expiry with cookie expiry
        //
        // Set auth cookie with expiry date:
        // * HttpOnly: True (prevents JavaScript access, to prevent theft/reuse)
        // * Secure: True (only sent over HTTPS)
        // * SameSite: 'Strict' or 'Lax' (CSRF protection: can't be sent from another site)
        // * Expires: Set the cookie expiration to match the session's expires_at time.
        // * Path: '/'
        await request.cookieStore?.set({
          name: "__Host-fp4auth", // __Host- prefix attaches the cookie to the host (foo.example.com) and not the registrable domain (example.com) *and* requires https
          value: await jwt.encrypt({
            email: results?.email,
            user_id: results!.id,
          }),
          // TODO: need to pass expiry to align with cookie
          // expires: without explicit expiry, cookies are deleted when "the current session is over",
          // but browsers keep/restore browsing sessions making it unclear
          // when/if these cookies would expire https://issues.chromium.org/issues/40217179
          // This is creating a unix timestamp + a days worth of milliseconds
          expires: Date.now() + 86400000, // one day. 60000 is one minute.
          path: "/", // This controls the paths (example.com/foo/bar) the cookie will be sent to. '/' means all of them.
          domain: "", // no domain can be set when using __Host-
          secure: true, // secure (only send when using https)
          sameSite: "lax", // don't send from other sites
          httpOnly: true, // do not make this cookie available to Javascript via document.cookie. Mitigates XXS.
        })
        return token
      },
    },
    Query: {
      hello: () => "world",
      seizures: (_root, _args, { db, authenticatedUser }) => {
        if (authenticatedUser) {
          const results = db.getSeizures()
          return results.results
        } else {
          throw new GraphQLError(
            "Authentication required to access this resource.",
            {
              extensions: {
                code: "UNAUTHENTICATED",
                http: { status: 401 },
              },
            },
          )
        }
      },
    },
  },
})
