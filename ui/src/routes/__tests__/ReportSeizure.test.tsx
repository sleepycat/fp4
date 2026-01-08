import "../../setupTests.ts"
import { describe, it } from "@std/testing/bdd"
import { expect, fn } from "@std/expect"
import { loader } from "../ReportSeizure.tsx"
import { UrqlClientContext } from "../../context.tsx"
import type { LoaderFunctionArgs } from "react-router"

describe("/report-seizure loader", () => {
  describe("loader", () => {
    it("redirects to /login if not logged in", async () => {
      const mockClient = {
        query: fn(() => Promise.resolve({ data: { loggedIn: false } })),
      }

      const mockContext = {
        get: fn(() => mockClient),
      }

      const response = await loader({
        context: mockContext,
        params: {},
        request: new Request("http://localhost/report-seizure"),
      } as unknown as LoaderFunctionArgs)

      expect(response).toBeInstanceOf(Response)
      expect(response?.status).toBe(302)
      expect(response?.headers.get("Location")).toBe("/login")
      expect(mockContext.get).toHaveBeenCalledWith(UrqlClientContext)
    })

    it("returns null if logged in", async () => {
      const mockClient = {
        query: fn(() => Promise.resolve({ data: { loggedIn: true } })),
      }

      const mockContext = {
        get: fn(() => mockClient),
      }

      const response = await loader({
        context: mockContext,
        params: {},
        request: new Request("http://localhost/report-seizure"),
      } as unknown as LoaderFunctionArgs)

      expect(response).toBeNull()
      expect(mockContext.get).toHaveBeenCalledWith(UrqlClientContext)
    })
  })
})
