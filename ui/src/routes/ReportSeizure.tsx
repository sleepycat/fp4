import { Trans } from "@lingui/react/macro"
import { t } from "@lingui/core/macro"
import {
  Button,
  DateField,
  DateInput,
  DateSegment,
  FieldError,
  Form,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Select,
  SelectValue,
  TextField,
} from "react-aria-components"
import { gql } from "urql"
import { redirect, useActionData, useNavigation, useSubmit } from "react-router"
import type { ActionFunctionArgs } from "react-router"
import { css } from "../../styled-system/css/index.mjs"
import { useEffect, useState } from "react"
import { ToastQueue } from "@adobe/react-spectrum"
import { UrqlClientContext } from "../context.tsx"

export function ReportSeizure() {
  const submit = useSubmit()
  const actionData = useActionData()
  const navigation = useNavigation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (actionData?.error) {
      setError(actionData.error)
    }
  }, [actionData])

  const SUBSTANCE_CATEGORIES = [
    { id: "CONTROLLED_SUBSTANCES", name: t`Controlled Substances` },
    { id: "PRECURSORS", name: t`Precursors` },
    { id: "CHEMICAL_OFFENCE_RELATED", name: t`Chemical Offence Related` },
    { id: "CANNABIS", name: t`Cannabis` },
    { id: "CHEMICAL_PROPERTY", name: t`Chemical Property` },
  ]

  const UNITS_OF_MEASURE = [
    { id: "GRAMS", name: t`Grams` },
    { id: "KILOGRAMS", name: t`Kilograms` },
    { id: "MICROGRAMS", name: t`Micrograms` },
    { id: "MILLIGRAMS", name: t`Milligrams` },
    { id: "MILLILITERS", name: t`Milliliters` },
    { id: "PATCH", name: t`Patch` },
    { id: "TABLETS", name: t`Tablets` },
    { id: "CAPSULES", name: t`Capsules` },
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit(e.currentTarget)
  }

  const fieldClass = css`
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  `

  const labelClass = css`
    font-weight: bold;
    margin-bottom: 0.5rem;
  `

  const inputClass = css`
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  `

  const buttonClass = css`
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    &:hover {
      background-color: #0056b3;
    }
  `

  const isSubmitting = navigation.state === "submitting"

  return (
    <div
      className={css`
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
      `}
    >
      <h1
        className={css`
          font-size: 2rem;
          margin-bottom: 1.5rem;
        `}
      >
        <Trans>Report Drug Seizure</Trans>
      </h1>

      {error && (
        <div
          className={css`
            color: red;
            margin-bottom: 1rem;
          `}
        >
          Error: {error}
        </div>
      )}

      <Form onSubmit={handleSubmit} method="post">
        <TextField name="reference" isRequired className={fieldClass}>
          <Label className={labelClass}>
            <Trans>Reference Number</Trans>
          </Label>
          <Input className={inputClass} />
          <FieldError
            className={css`
              color: red;
              font-size: 0.875rem;
            `}
          />
        </TextField>

        <DateField name="seizedOn" isRequired className={fieldClass}>
          <Label className={labelClass}>
            <Trans>Seized On</Trans>
          </Label>
          <DateInput
            className={css`
              display: flex;
              gap: 2px;
              padding: 0.5rem;
              border: 1px solid #ccc;
              border-radius: 4px;
            `}
          >
            {(segment) => (
              <DateSegment
                segment={segment}
                className={css`
                  padding: 0 2px;
                `}
              />
            )}
          </DateInput>
          <FieldError
            className={css`
              color: red;
              font-size: 0.875rem;
            `}
          />
        </DateField>

        <TextField name="location" isRequired className={fieldClass}>
          <Label className={labelClass}>
            <Trans>Location</Trans>
          </Label>
          <Input className={inputClass} />
          <FieldError
            className={css`
              color: red;
              font-size: 0.875rem;
            `}
          />
        </TextField>

        <div
          className={css`
            border: 1px solid #eee;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.2rem;
              margin-bottom: 1rem;
            `}
          >
            <Trans>Substance Details</Trans>
          </h3>

          <TextField name="substanceName" isRequired className={fieldClass}>
            <Label className={labelClass}>
              <Trans>Substance Name</Trans>
            </Label>
            <Input className={inputClass} />
            <FieldError
              className={css`
                color: red;
                font-size: 0.875rem;
              `}
            />
          </TextField>

          <Select name="substanceCategory" isRequired className={fieldClass}>
            <Label className={labelClass}>
              <Trans>Category</Trans>
            </Label>
            <Button className={inputClass}>
              <SelectValue />
              <span aria-hidden="true">▼</span>
            </Button>
            <Popover
              className={css`
                border: 1px solid #ccc;
                background: white;
                border-radius: 4px;
                padding: 0.5rem;
              `}
            >
              <ListBox
                className={css`
                  outline: none;
                `}
              >
                {SUBSTANCE_CATEGORIES.map((category) => (
                  <ListBoxItem
                    key={category.id}
                    id={category.id}
                    className={css`
                      padding: 0.25rem;
                      cursor: pointer;
                      &[data-focused] {
                        background-color: #f0f0f0;
                      }
                    `}
                  >
                    {category.name}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Popover>
            <FieldError
              className={css`
                color: red;
                font-size: 0.875rem;
              `}
            />
          </Select>

          <NumberField
            name="substanceAmount"
            isRequired
            minValue={0}
            className={fieldClass}
          >
            <Label className={labelClass}>
              <Trans>Amount</Trans>
            </Label>
            <Group
              className={css`
                display: flex;
              `}
            >
              <Input className={inputClass} />
            </Group>
            <FieldError
              className={css`
                color: red;
                font-size: 0.875rem;
              `}
            />
          </NumberField>

          <Select name="substanceUnit" isRequired className={fieldClass}>
            <Label className={labelClass}>
              <Trans>Unit</Trans>
            </Label>
            <Button className={inputClass}>
              <SelectValue />
              <span aria-hidden="true">▼</span>
            </Button>
            <Popover
              className={css`
                border: 1px solid #ccc;
                background: white;
                border-radius: 4px;
                padding: 0.5rem;
              `}
            >
              <ListBox
                className={css`
                  outline: none;
                `}
              >
                {UNITS_OF_MEASURE.map((unit) => (
                  <ListBoxItem
                    key={unit.id}
                    id={unit.id}
                    className={css`
                      padding: 0.25rem;
                      cursor: pointer;
                      &[data-focused] {
                        background-color: #f0f0f0;
                      }
                    `}
                  >
                    {unit.name}
                  </ListBoxItem>
                ))}
              </ListBox>
            </Popover>
            <FieldError
              className={css`
                color: red;
                font-size: 0.875rem;
              `}
            />
          </Select>
        </div>

        <Button type="submit" className={buttonClass} isDisabled={isSubmitting}>
          <Trans>Submit Report</Trans>
        </Button>
      </Form>
    </div>
  )
}

export async function action({ context, request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const input = {
    reference: formData.get("reference"),
    seizedOn: formData.get("seizedOn"),
    location: formData.get("location"),
    substances: [
      {
        name: formData.get("substanceName"),
        category: formData.get("substanceCategory"),
        amount: parseFloat(formData.get("substanceAmount") as string),
        unit: formData.get("substanceUnit"),
      },
    ],
  }

  const client = context.get(UrqlClientContext)
  const result = await client.mutation(
    gql`
      mutation ReportDrugSeizure($input: SeizureInput) {
        reportDrugSeizure(input: $input)
      }
    `,
    { input },
  )

  const { error } = result
  if (error) {
    return { error: error.message }
  }

  ToastQueue.positive(t`Seizure reported successfully!`, { timeout: 5000 })
  return redirect("/drug-seizures")
}

const ReportSeizureRoute = {
  path: "report-seizure",
  Component: ReportSeizure,
  action,
}

export default ReportSeizureRoute
