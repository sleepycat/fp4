import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/macro";
import type { LoaderFunctionArgs } from "react-router";
import { Link, redirect, useLoaderData, useNavigation } from "react-router";
// import { Trans } from "@lingui/react/macro";
import { gql } from "urql";
import { UrqlClientContext } from "../context.tsx";

export function Verify() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();
  console.log({ loaderData });

  // The loader is running
  if (navigation.state === "loading") {
    return (
      <div>
        <h2>Verifying your login...</h2>
        <p>Please wait a moment. ✨</p>
      </div>
    );
  }

  // The loader finished and returned an error
  if (loaderData?.error) {
    return (
      <div>
        <h2>
          <Trans>Login Failed</Trans>
        </h2>
        <p style={{ color: "red" }}>{loaderData.error}</p>
        <p>
          <Trans>
            Please try to <Link to="/login">login</Link> again.
          </Trans>
        </p>
      </div>
    );
  }
}

export async function loader({ context, params }: LoaderFunctionArgs) {
  const { token } = params;
  console.log({ token });
  if (!token) {
    // This case is unlikely if the route matches, but good for safety
    return redirect("/login");
  }

  const client = context.get(UrqlClientContext);
  const result = await client.mutation(
    gql`
       mutation VERIFY ($token: ULID!){
         verify(token: $token)
       }
    `,
    { token },
  );

  const { error } = result;
  if (error) {
    if (error.message.match(/expired/)) {
      return { error: t`Your authentication token has expired.` };
    } else {
      return { error: error.message };
    }
  } else {
    return redirect("/");
  }
}

const VerifyRoute = {
  path: "verify/:token",
  Component: Verify,
  loader,
};

export default VerifyRoute;
