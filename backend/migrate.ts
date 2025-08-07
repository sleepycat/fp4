import { DatabaseSync } from "node:sqlite"
import migrate from "@gordonb/sqlite-migrate"
import migrations from "./migrations.ts"

const db = new DatabaseSync("./seizures.db")

const result = migrate(db, migrations)

console.log(`Migrated to version ${result.version}`)

if (result.error) {
  console.error("Migration failed:", result.error)
}

db.close()
