import { DatabaseSync } from "node:sqlite"
import migrate from "jsr:@gordonb/sqlite-migrate"
import migrations from "./migrations.ts"

const DB_PATH = Deno.env.get("DB_PATH")
if (DB_PATH === undefined || DB_PATH == "") {
  throw new Error(
    "The DB_PATH envrionmental variable must be defined.",
  )
}
const db = new DatabaseSync(DB_PATH)

const result = migrate(db, migrations)

console.log(`Migrated to version ${result.version}`)

if (result.error) {
  console.error("Migration failed:", result.error)
}

db.close()
