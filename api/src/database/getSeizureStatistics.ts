import { DatabaseSync } from "node:sqlite"

export function getSeizureStatistics(db: DatabaseSync, year: number) {
    const query = db.prepare(`
    SELECT
        CAST(strftime('%m', s.seized_on) AS INTEGER) as month_num,
        sub.name as drugType,
        SUM(sub.amount) as amount
    FROM seizures s
    JOIN substances sub ON s.id = sub.seizure_id
    WHERE strftime('%Y', s.seized_on) = ?
    GROUP BY month_num, drugType
    ORDER BY month_num
  `)

    interface SeizureStatRow {
        month_num: number
        drugType: string
        amount: number
    }

    const rows = query.all(year.toString()) as unknown as SeizureStatRow[]

    return rows.map((row) => ({
        id: `${year}-${row.month_num}-${row.drugType}`,
        month: row.month_num,
        drugType: row.drugType,
        amount: row.amount,
    }))
}
