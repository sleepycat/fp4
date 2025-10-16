import { useActionData, useNavigation, useSubmit } from "react-router";
import { Trans } from "@lingui/react/macro";
import { css } from "../../styled-system/css/css.mjs";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "react-aria-components";
import type { ActionFunctionArgs } from "react-router";
import { gql } from "urql";
import { UrqlClientContext } from "../context.tsx";

export function Login() {
  const navigation = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(e.currentTarget);
  };

  const isSubmitting = navigation.state === "submitting";

  return (
    <>
      <section>
        <Trans>
          Please enter your Police service email below to receive a login link.
        </Trans>
        <Form
          method="post"
          validationErrors={actionData?.errors}
          onSubmit={onSubmit}
        >
          <TextField name="email" type="email" isRequired>
            <Label
              className={css`
                padding-right: 1em;
              `}
            >
              Email:
            </Label>
            <Input
              className={css`
                padding: 0.5rem;
                width: 14em;
                border: 0.125rem solid token(colors.gray);
                border-radius: token(radii.sm);

                &[data-invalid] {
                  border: 2px solid token(colors.rcmpred);
                }
              `}
            />
            <FieldError
              className={css`
                padding: 1em;
              `}
            />
          </TextField>
          <Button
            className={css`
              margin: 2em 0em;
              width: 14em;
              padding: 0.5em 1em;
              border-radius: token(radii.sm);
              color: token(colors.white);
              background: token(colors.gray);
            `}
            type="submit"
            isDisabled={isSubmitting}
          >
            Submit
          </Button>
        </Form>
        {actionData?.message && (
          <p style={{ color: "green" }}>{actionData.message}</p>
        )}
        {actionData?.error && <p style={{ color: "red" }}>{actionData.error}
        </p>}
      </section>
    </>
  );
}

export async function action({ context, request }: ActionFunctionArgs) {
  const form = await request.formData();
  // @ts-expect-error: Typescript doesn't understand this.
  const formData = Object.fromEntries(form);
  // TODO: validate schema {email: string}
  // although, the field itself also does validation and so does the api...

  const client = context.get(UrqlClientContext);
  const result = await client.mutation(
    gql`
       mutation LOGIN ($email: EmailAddress!){
         login(email: $email)
       }
    `,
    formData,
  );
  const { data, fetching, error } = result;
  if (fetching) return [];
  if (error) {
    return { error: "Something went wrong. Please try again." };
  } else {
    return { message: data.login };
  }
}

const LoginRoute = {
  path: "login",
  Component: Login,
  action,
};

export default LoginRoute;
