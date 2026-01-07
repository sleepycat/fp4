import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect/expect"
// loggedIn resolver function
import { loggedIn } from "../loggedIn.ts"

describe("loggedIn", () => {
  it("returns true when authenticatedUser is present", () => {
    const context = {
      authenticatedUser: { user_id: 1, email: "test@example.com" },
    }
    // @ts-ignore: minimal context mock
    expect(loggedIn(undefined, undefined, context)).toBe(true)
  })

  it("returns false when authenticatedUser is missing", () => {
    const context = {}
    // @ts-ignore: minimal context mock
    expect(loggedIn(undefined, undefined, context)).toBe(false)
  })
})
