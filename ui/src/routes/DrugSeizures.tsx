import { Trans } from "@lingui/react/macro"
import { css } from "../../styled-system/css/css.mjs"
import { Link, redirect, useLoaderData } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { gql } from "urql"
import { UrqlClientContext } from "../context.tsx"

// TODO this should be an authenticated route.
export function DrugSeizures() {
  const data = useLoaderData()
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
    <li
      className={css`
        padding: 0.5em;
        border-bottom: 3px solid #ccc;
      `}
      key={el.cursor}
    >
      <span
        className={css`
          font-weight: bold;
        `}
      >
        Substance
      </span>: {el.node.substance} <br />
      <span
        className={css`
          font-weight: bold;
        `}
      >
        Amount
      </span>: {el.node.amount} <br />
      <span
        className={css`
          font-weight: bold;
        `}
      >
        Seized on
      </span>: {el.node.seizedOn} <br />
      <span
        className={css`
          font-weight: bold;
        `}
      >
        Reported on
      </span>: {el.node.reportedOn}
    </li>
  ))

  return (
    <>
      <h1>
        <Trans>Drug Seizures</Trans>
      </h1>

      <ul>{seizures}</ul>
      <div
        className={css`
          display: flex;
          gap: 1 rem;
          padding: 1 em;
        `}
      >
        {pageInfo.hasPreviousPage && (
          <Link
            className={css`
              text-decoration: underline;
              font-weight: bold;
            `}
            to={`?before=${pageInfo.startCursor}&last=10`}
          >
            Previous
          </Link>
        )}
        {pageInfo.hasNextPage && (
          <Link
            className={css`
              text-decoration: underline;
              font-weight: bold;
            `}
            to={`?after=${pageInfo.endCursor}&first=10`}
          >
            Next
          </Link>
        )}
      </div>
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
      first: !first && !last ? 8 : first,
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
