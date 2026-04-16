import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Direct connection — bypasses Supavisor, max:1 for serverless
const client = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 })
export const db = drizzle(client, { schema })
