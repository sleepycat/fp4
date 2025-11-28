// This file defines global objects like document using JSDOM.
// It must be imported before screen, which uses document.
import "../../setupTests.ts"

import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { render, screen, waitFor } from "@testing-library/react"
// import {
//   createMemoryRouter,
//   RouterContextProvider,
//   RouterProvider,
// } from "react-router"
import { createRoutesStub } from "react-router"
import { DrugSeizures } from "../DrugSeizures.tsx"

// Mock data
const mockSeizures = {
  pageInfo: {
    hasNextPage: true,
    hasPreviousPage: true,
    startCursor: "c1",
    endCursor: "c2",
  },
  edges: [
    {
      cursor: "c1",
      node: {
        id: "1",
        substance: "Cocaine",
        amount: 100,
        seizedOn: "2023-01-01",
        reportedOn: "2023-01-02",
      },
    },
    {
      cursor: "c2",
      node: {
        id: "2",
        substance: "Heroin",
        amount: 50,
        seizedOn: "2023-02-01",
        reportedOn: "2023-02-02",
      },
    },
  ],
}

describe("/drug-seizures", () => {
  it("renders list of seizures and pagination buttons", async () => {
    const Stub = createRoutesStub([
      {
        path: "/drug-seizures",
        Component: DrugSeizures,
        // without this you get a warning in the test output:
        // `No `HydrateFallback` element provided to render during initial hydration`
        HydrateFallback: () => null,
        // using a loader triggers async data loading behaviour
        // which means using `waitFor` below to wait for a render with data
        loader() {
          return mockSeizures
        },
      },
    ])

    render(<Stub initialEntries={["/drug-seizures"]} />)

    await waitFor(() => {
      // Verify pagination buttons
      const prevLink = screen.getByText("Previous") as HTMLAnchorElement
      const nextLink = screen.getByText("Next") as HTMLAnchorElement

      expect(prevLink.getAttribute("href")).toContain("before=c1")
      expect(nextLink.getAttribute("href")).toContain("after=c2")
    })
  })
})
