import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect"

import { allowList } from "../allowList.ts"

describe("allowList", () => {
  describe("given a comma separated list of domains", () => {
    describe("when passed an email whose domain is included in the list", () => {
      it("returns true ", () => {
        const isAllowed = allowList("example.com,example.ca")
        const result = isAllowed("foo@example.com")
        expect(result).toEqual(true)
      })
    })
    describe("when passed an email whose domain is not included", () => {
      it("returns false", () => {
        const isAllowed = allowList("example.com,example.ca")
        expect(isAllowed("foo@bad.com")).toBeFalsy()
      })
    })
  })
})
