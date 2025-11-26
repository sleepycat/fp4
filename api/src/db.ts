import { DatabaseSync } from "node:sqlite"
import { migrate as sqlitemigrate } from "@gordonb/sqlite-migrate"
import migrations from "../migrations.ts"
import { findOrCreateUser } from "./database/findOrCreateUser.ts"
import { consumeMagicLink } from "./database/consumeMagicLink.ts"
import { addSeizure } from "./database/addSeizure.ts"
import { getSeizures } from "./database/getSeizures.ts"
import { deleteHash } from "./database/deleteHash.ts"
import { saveHash } from "./database/saveHash.ts"

export function migrate(db: DatabaseSync) {
  const result = sqlitemigrate(db, migrations)

  console.log(`Migrated to version ${result.version}`)

  if (result.error) {
    console.error("Migration failed:", result.error)
  }

  db.close()
}

type SaveHashArguments = Parameters<typeof saveHash>[1]
type SeizureRecord = Parameters<typeof addSeizure>[1]
type GetSeizuresArgs = Parameters<typeof getSeizures>[1]

export type DataAccessors = ReturnType<typeof dataAccessors>

export function dataAccessors(db: DatabaseSync) {
  return {
    findOrCreateUser: (email: string) => findOrCreateUser(db, email),
    consumeMagicLink: (hash: string) => consumeMagicLink(db, hash),
    getSeizures: (args: GetSeizuresArgs = {}) => getSeizures(db, args),
    addSeizure: (record: SeizureRecord) => addSeizure(db, record),
    saveHash: (args: SaveHashArguments) => saveHash(db, args),
    deleteHash: (hash: string) => deleteHash(db, hash),
  }
}
