// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);



const mariadb = require('mariadb');
const util = require('util');

export const pool = mariadb.createPool({
  host: 'localhost',
  user:'changethisdbuser',
  password: 'changethispassword',
  connectionLimit: 5,
  database: 'changethisdatabase'
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.')
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.')
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.')
    }
  }
  if (connection) connection.release()
  return
});

export function query (q,vars) {

  const result = pool.query( {  namedPlaceholders: true, sql: q }, vars);
  return result;

}





