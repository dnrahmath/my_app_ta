//import 'dotenv/config';

require('dotenv').config({path:__dirname+'/.env'})  //didalam heroku

//--------------------Data Security Database  [7]

module.exports = {
  
  //HOST: "localhost",
  //PORT: "3306",
  //USER: "dnrahmath",
  //PASSWORD: "herlambang66",
  //DB: "backendtaapp"

  HOST: process.env.APP_RDBMS_HOST,
  PORT: process.env.APP_RDBMS_DB_PORT,
  USER: process.env.APP_RDBMS_USER,
  PASSWORD: process.env.APP_RDBMS_PASSWORD,
  DB: process.env.APP_RDBMS_DB
};
