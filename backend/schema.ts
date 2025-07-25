import { createSchema } from 'graphql-yoga'
import { rateLimitDirective } from 'graphql-rate-limit-directive'
import { EmailAddressTypeDefinition, EmailAddressResolver } from 'graphql-scalars';

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } = rateLimitDirective();

 
export const schema = rateLimitDirectiveTransformer(createSchema({
  typeDefs: [
    rateLimitDirectiveTypeDefs, 
    /* GraphQL */ `
    scalar EmailAddress

    type Query {
      hello: String
    }

    type Mutation {
      # Provide an email address to log in via magic links
      login(email: EmailAddress!): String @rateLimit(limit: 5, duration: 60)
      # Verify the token you recieved to create a session.
      verify(token: String!): String @rateLimit(limit: 5, duration: 60)
    }
  `],
  resolvers: {
    EmailAddress: EmailAddressResolver,
    Mutation: {
      login: (parent, {email}) => {
        // DONE: Check rate limit. Handled at the schema level by graphql-rate-limit-directive
        // TODO: Split user from domain and check if email is on allow-list: Check ALLOWED_DOMAINS env var. return generic message
        // TODO: Find or create user/email in sqlite
        // TODO: generate monotonic ulid (monotonicUlid) token: embedded timestamp + 80 bits of randomness. https://jsr.io/@std/ulid/doc/decode-time/~/decodeTime This allows us skip storing created_at/expires_at values.
        // TODO: hashed_token = SHA256(monoticUlid())
        // TODO: Save hashed_token to sqlite: CREATE TABLE magic_links (id: integer primary key autoincrement, token_hash: text, user_id: integer)
        // TODO: send email using notification.canada.ca. Use client provided by graphql context.
        // DONE: Return generic message to prevent user enumeration:
        return "If an account exists for this email, a login link has been sent."
      },
      verify: (parent: {token}) => {
        // Stateless expiry check because of ulid timestamp: decodeTime(token) reject if older than 15 minutes.
        // Create a SHA-256 Hash of token
        // Look up hash in magic_links in transaction: (learn how to do this in sqlite)
        // * no records == invalid
        // * user_id returned == valid
        // * immediately delete in same transation
        // Set cookie with expiry date:
        // * HttpOnly: True (prevents JavaScript access)
        // * Secure: True (only sent over HTTPS)
        // * SameSite: 'Strict' or 'Lax' (CSRF protection)
        // * Expires: Set the cookie expiration to match the session's expires_at time.
        // * Path: '/'
        return token
      }
    },
    Query: {
      hello: () => 'world'
    }
  }
}))
