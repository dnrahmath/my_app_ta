const mysql = require("mysql2");  // awal membutuhkan module mysql2 dan bukan mysql
//--------------------Membutuhkan config awal  [6]
const dbConfig = require("../db.config.js");
//--------------------"Koneksi ke database mysql"

//var connection = mysql.createConnection({
/*connection*/
let pool = mysql.createPool({
  connectionLimit : 100, //important
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  multipleStatements: true
});


/*--------------------------------------------------------*/

/*
// open the MySQL connection
connection.connect(function(err) {
  if (err) {
    return console.error('error: ' + err.message);
  }
  console.log('Connected to the MariaDB server.');
});
*/


//module.exports = connection;
module.exports = pool;
