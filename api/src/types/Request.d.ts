import type { CookieStore } from "@whatwg-node/cookie-store/"

// Augment the global Request interface
interface Request {
  cookieStore?: CookieStore
}
