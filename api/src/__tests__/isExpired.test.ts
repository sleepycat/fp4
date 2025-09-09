import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"
import { isExpired } from "../isExpired.ts"
import { ulid } from "jsr:@std/ulid"

describe("isExpired", () => {
  it("returns true if the ulid token is older than the minutesTillExpiry value", () => {
    const oldtoken = "01K3V78Q0HPX76B44HRRZWA5PJ" // ulid token from a long time ago
    expect(isExpired({ token: oldtoken, minutesTillExpiry: 1 })).toEqual(true)
  })

  it("returns false if the ulid token is newer than the minutesTillExpiry value", () => {
    const newtoken = ulid()
    expect(isExpired({ token: newtoken, minutesTillExpiry: 1 })).toEqual(false)
  })
})
