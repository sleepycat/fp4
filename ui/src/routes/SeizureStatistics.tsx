import { Trans } from "@lingui/react/macro"
import { AgCharts } from "ag-charts-react"
import {
  AgChartOptions,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-charts-community"
import { useMemo, useState } from "react"
import { useQuery } from "urql"

ModuleRegistry.registerModules([AllCommunityModule])

const SEIZURE_STATISTICS_QUERY = `
  query GetSeizureStatistics($year: ReportingYear!) {
    seizureStatistics(year: $year) {
      id
      month
      drugType
      amount
    }
  }
`

interface SeizureStatistic {
  id: string
  month: number
  drugType: string
  amount: number
}

export const SeizureStatistics = () => {
  // Default to current year for now
  const [year, _setYear] = useState(new Date().getFullYear())

  const [result] = useQuery<{ seizureStatistics: SeizureStatistic[] }>({
    query: SEIZURE_STATISTICS_QUERY,
    variables: { year },
  })

  const { data, fetching, error } = result

  const chartData = useMemo(() => {
    if (!data?.seizureStatistics) return []

    // Transform "Long" format to "Wide" format
    // Long: [{ month: 1, drugType: 'Cannabis', amount: 10 }, { month: 1, drugType: 'LSD', amount: 5 }]
    // Wide: [{ month: 'Jan', Cannabis: 10, LSD: 5 }, ...]

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    const grouped = new Map<number, Record<string, string | number>>()

    // Initialize all months
    months.forEach((monthName, index) => {
      grouped.set(index + 1, { month: monthName })
    })

    data.seizureStatistics.forEach((stat) => {
      const monthEntry = grouped.get(stat.month)
      if (monthEntry) {
        monthEntry[stat.drugType] = stat.amount
      }
    })

    return Array.from(grouped.values())
  }, [data])

  const substanceNames = useMemo(() => {
    if (!data?.seizureStatistics) return []
    const names = new Set(data.seizureStatistics.map((s) => s.drugType))
    return Array.from(names)
  }, [data])

  const options: AgChartOptions = useMemo(() => ({
    title: {
      text: "Seizures by Substance",
    },
    data: chartData,
    series: substanceNames.map((name) => ({
      type: "bar",
      xKey: "month",
      yKey: name,
      yName: name,
      stacked: true,
    })),
  }), [chartData, substanceNames])

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <>
      <h1>
        <Trans>Seizure Statistics</Trans>
      </h1>
      <section style={{ height: "500px", width: "100%" }}>
        <AgCharts options={options} />
      </section>
    </>
  )
}

const SeizureStatisticsRoute = {
  path: "seizure-statistics",
  Component: SeizureStatistics,
}

export default SeizureStatisticsRoute
