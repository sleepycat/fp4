import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"
import { sha256 } from "../sha256.ts"

describe("sha256()", () => {
  it("hashes the string passed to it", async () => {
    const hash = await sha256("test")
    expect(hash).toEqual(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    )
  })
})
