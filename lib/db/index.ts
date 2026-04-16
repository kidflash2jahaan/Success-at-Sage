import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Session mode pooler (port 5432) — supports prepared statements
const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
