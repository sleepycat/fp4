import { Trans } from "@lingui/react/macro";
import { ErrorBoundary } from "react-error-boundary";
import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { gql } from "urql";
import { UrqlClientContext } from "../context.tsx";

// TODO this should be an authenticated route.
export function DrugSeizures() {
  const response = useLoaderData();

  const seizures = response.map((
    el: {
      substance: string;
      amount: number;
      seizedOn: string;
      reportedOn: string;
    },
  ) => (
    <li>
      Substance: {el.substance}
      <br />Amount: {el.amount}
      <br />Seized on: {el.seizedOn}
      <br />Reported on: {el.reportedOn}
    </li>
  ));

  return (
    <>
      <h1>
        <Trans>Drug Seizures</Trans>
      </h1>

      <ErrorBoundary fallback={<div>Please Log in.</div>}>
        <ul>{seizures}</ul>
      </ErrorBoundary>
    </>
  );
}

export async function loader({ context }: LoaderFunctionArgs) {
  const client = context.get(UrqlClientContext);
  const result = await client.query(
    gql`
       {
         seizures {
           substance
           amount
           reportedOn
           seizedOn
         }
       }
    `,
    {},
  );
  const { data, fetching, error } = result;
  if (fetching) return [];
  if (error) {
    if (error.message.match(/Authentication required/)) {
      return redirect("/login");
    } else {
      // what the heck just happened?
      console.error({
        error,
        message: error.message,
        code: error.graphQLErrors[0].extensions.code,
      });
    }
  }
  return data.seizures;
}

const DrugSeizuresRoute = {
  path: "drug-seizures",
  // TODO: does this need to read from document.cookies?
  // middleware: [Authentication]
  Component: DrugSeizures,
  loader,
};
export default DrugSeizuresRoute;
