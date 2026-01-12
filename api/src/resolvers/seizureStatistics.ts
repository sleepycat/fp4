import type { Context } from "../types/Context.ts"

export const seizureStatistics = (_parent: unknown, args: { year: number }, context: Context) => {
    return context.db.getSeizureStatistics(args.year)
}
