import type { Context } from "../types/Context.ts"

const toBase64 = (str: string) => {
  // @ts-ignore: toBase64 is actually a property of TextEncoder
  return new TextEncoder().encode(str).toBase64({ alphabet: "base64url" })
}

const fromBase64 = (str: string) => {
  // @ts-ignore: toBase64 is actually a property of TextEncoder
  const bytes = Uint8Array.fromBase64(str, { alphabet: 'base64url' });
  // 2. Decode bytes back to text
  const decodedText = new TextDecoder().decode(bytes);
  return decodedText
}

export function seizures(
  _root: undefined,
  args: { first?: number; after?: string | undefined; last?: number; before?: string | undefined },
  { db }: Context,
) {
  if (args.first && args.last) {
    throw new Error("Cannot specify both first and last")
  }
  if (!args.first && !args.last) {
    throw new Error("Must specify first or last")
  }
  if (args.after && args.before) {
    throw new Error("Cannot specify both after and before")
  }
  if (args.after && !args.first) {
    throw new Error("Cannot specify after without first")
  }
  if (args.before && !args.last) {
    throw new Error("Cannot specify before without last")
  }


  const { results, hasMore } = db.getSeizures({
    first: args.first,
    after: args.after ? parseInt(fromBase64(args.after).split("/")[1], 10) : undefined,
    last: args.last,
    before: args.before ? parseInt(fromBase64(args.before).split("/")[1], 10) : undefined,
  })

  if (!results) {
    return {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    }
  }

  const edges = results.map((node) => ({
    cursor: toBase64(`seizures/${node.id}`),
    node,
  }))

  let hasNextPage = false
  let hasPreviousPage = false

  if (args.last) {
    hasPreviousPage = hasMore
    hasNextPage = !!args.before
  } else {
    hasNextPage = hasMore
    hasPreviousPage = !!args.after
  }

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? toBase64(`seizures/${edges[0].node.id}`) : null,
      endCursor: edges.length > 0 ? toBase64(`seizures/${edges[edges.length - 1].node.id}`) : null,
    },
  }
}
