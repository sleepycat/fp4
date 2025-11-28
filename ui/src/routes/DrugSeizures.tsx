import { Trans } from "@lingui/react/macro"
import { ErrorBoundary } from "react-error-boundary"
import { Link, redirect, useLoaderData } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { gql } from "urql"
import { UrqlClientContext } from "../context.tsx"

// TODO this should be an authenticated route.
export function DrugSeizures() {
  const data = useLoaderData()
  console.log({ loaderData: data })
  const { edges, pageInfo } = data

  const seizures = edges.map((
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
        <div style={{ display: "flex", gap: "1rem" }}>
          {pageInfo.hasPreviousPage && (
            <Link to={`?before=${pageInfo.startCursor}&last=10`}>Previous</Link>
          )}
          {pageInfo.hasNextPage && (
            <Link to={`?after=${pageInfo.endCursor}&first=10`}>Next</Link>
          )}
        </div>
      </ErrorBoundary>
    </>
  )
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const client = context.get(UrqlClientContext)
  const url = new URL(request.url)
  const after = url.searchParams.get("after")
  const before = url.searchParams.get("before")
  const first = url.searchParams.get("first")
    ? Number.parseInt(url.searchParams.get("first")!)
    : undefined
  const last = url.searchParams.get("last")
    ? Number.parseInt(url.searchParams.get("last")!)
    : undefined

  const result = await client.query(
    gql`
      query seizures($first: Int, $after: ID, $last: Int, $before: ID) {
        seizures(first: $first, after: $after, last: $last, before: $before) {
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
    {
      first: !first && !last ? 10 : first,
      after,
      last,
      before,
    },
  )
  const { data, fetching, error } = result
  if (fetching) return { edges: [], pageInfo: {} }
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
  return data.seizures
}

const DrugSeizuresRoute = {
  path: "drug-seizures",
  // TODO: does this need to read from document.cookies?
  // middleware: [Authentication]
  Component: DrugSeizures,
  loader,
}

export default DrugSeizuresRoute
