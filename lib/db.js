import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.SIMPLEPATCHES_BOOK_DATABASE_URL);