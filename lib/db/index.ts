import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Direct connection to Supabase (IPv6, bypasses Supavisor pooler)
const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
export const db = drizzle(client, { schema })
