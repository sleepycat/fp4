import "../../setupTests.ts"
import { describe, it } from "@std/testing/bdd"
import { expect } from "@std/expect"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { createRoutesStub } from "react-router"
import ReportSeizure from "../ReportSeizure.tsx"
import { Provider } from "urql"

// Mock urql client
const mockClient = {
    executeQuery: () => ({ subscribe: (cb: any) => { cb({ data: null }); return { unsubscribe: () => { } } } }),
    executeMutation: () => ({ subscribe: (cb: any) => { cb({ data: { reportDrugSeizure: "success" } }); return { unsubscribe: () => { } } } }),
    subscription: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }),
}

describe("/report-seizure", () => {
    it("renders the form and submits data", async () => {
        const Stub = createRoutesStub([
            {
                path: "/report-seizure",
                Component: () => (
                    <Provider value={mockClient as any}>
                        <ReportSeizure />
                    </Provider>
                ),
            },
        ])

        render(<Stub initialEntries={["/report-seizure"]} />)

        screen.debug()

        // Check if form elements are present
        expect(screen.getByLabelText("Reference Number")).toBeTruthy()
        expect(screen.getByLabelText("Seized On")).toBeTruthy()
        expect(screen.getByLabelText("Location")).toBeTruthy()
        expect(screen.getByLabelText("Substance Name")).toBeTruthy()
        expect(screen.getByLabelText("Category")).toBeTruthy()
        expect(screen.getByLabelText("Amount")).toBeTruthy()
        expect(screen.getByLabelText("Unit")).toBeTruthy()

        // Fill out the form
        fireEvent.change(screen.getByLabelText("Reference Number"), { target: { value: "REF123" } })
        fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Warehouse" } })
        fireEvent.change(screen.getByLabelText("Substance Name"), { target: { value: "Cocaine" } })
        fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100" } })

        // Select Category
        const categoryButton = screen.getByLabelText("Category")
        fireEvent.click(categoryButton)
        const categoryOption = await screen.findByText("Controlled Substances")
        fireEvent.click(categoryOption)

        // Select Unit
        const unitButton = screen.getByLabelText("Unit")
        fireEvent.click(unitButton)
        const unitOption = await screen.findByText("Grams")
        fireEvent.click(unitOption)

        const submitButton = screen.getByText("Submit Report")
        expect(submitButton).toBeTruthy()
    })
})
