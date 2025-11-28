import { Trans } from "@lingui/react/macro"
import { ErrorBoundary } from "react-error-boundary"
import { redirect, useLoaderData } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { gql } from "urql"
import { UrqlClientContext } from "../context.tsx"

// TODO this should be an authenticated route.
export function DrugSeizures() {
  const response = useLoaderData()

  const seizures = response.map((
    el: {
      cursor: string
      node: {
        id: string
        substance: string
        amount: number
        seizedOn: string
        reportedOn: string
      }
    },
  ) => (
    <li key={el.cursor}>
      Substance: {el.node.substance}
      <br />Amount: {el.node.amount}
      <br />Seized on: {el.node.seizedOn}
      <br />Reported on: {el.node.reportedOn}
    </li>
  ))

  return (
    <>
      <h1>
        <Trans>Drug Seizures</Trans>
      </h1>

      <ErrorBoundary fallback={<div>Please Log in.</div>}>
        <ul>{seizures}</ul>
      </ErrorBoundary>
    </>
  )
}

export async function loader({ context }: LoaderFunctionArgs) {
  const client = context.get(UrqlClientContext)
  const result = await client.query(
    gql`
      query seizures {
        seizures(first: 10) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            cursor
            node {
              id
              amount
              seizedOn
              reportedOn
              substance
            }
          } 
        }
      }
    `,
    {},
  )
  const { data, fetching, error } = result
  if (fetching) return []
  if (error) {
    if (error.message.match(/Authentication required/)) {
      return redirect("/login")
    } else {
      // what the heck just happened?
      console.error({
        error,
        message: error.message,
        code: error.graphQLErrors[0].extensions.code,
      })
    }
  }
  return data.seizures.edges
}

const DrugSeizuresRoute = {
  path: "drug-seizures",
  // TODO: does this need to read from document.cookies?
  // middleware: [Authentication]
  Component: DrugSeizures,
  loader,
}
export default DrugSeizuresRoute
