// This file defines global objects like document.
// it must be imported before screen, which uses document.
import "../../setupTests.ts"

import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { createRoutesStub } from "react-router"
import { About } from "../../routes/About.tsx"
import { render, screen } from "@testing-library/react"

describe("/about", () => {
  it("renders a page with a heading that says 'About'", () => {
    const Stub = createRoutesStub([
      {
        path: "/about",
        Component: About,
      },
    ])

    render(<Stub initialEntries={["/about"]} />)

    const element = screen.getByRole("heading")

    expect(element.innerHTML).toEqual("About")
  })
})
