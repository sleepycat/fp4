import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"

import { allowList } from "../allowList.ts"

describe("allowList", () => {
  it("works", () => {
    const isAllowed = allowList("example.com,example.ca")
    const result = isAllowed("foo@example.com")
    expect(result).toEqual(true)
  })
})
