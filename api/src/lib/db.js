import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cams',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true,
  timezone: 'Z'
});
export async function one(sql, params = [], conn = pool) {
  const [rows] = await conn.execute(sql, params);
  return rows[0] ?? null;
}
export async function rows(sql, params = [], conn = pool) {
  const [records] = await conn.execute(sql, params);
  return records;
}
export async function transaction(action) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
