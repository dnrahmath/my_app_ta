"use strict";


const functions = require("firebase-functions");



//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------

//require("dotenv/config");
require('dotenv').config({ path: __dirname + '/.env' })

//--------------------Menjalankan server.js  [1]
console.log('Proyek node.js menggunakan nodemon');
console.log(`------------------------------------------------------`);

global.__root = __dirname + '/'; //__dirname menunjukan lokasi file dan titik file ini -> lalu dijadikan root

const cookieParser = require('cookie-parser');
const multer = require('multer');
const express = require("express");
const verifyJWT = require('./app/aconfig/middleware/verifyJWT');

const app = express();


//---------------------------------------------------------------------------------------


// credentials
app.use(function (req, res, next) {
  const allowedOrigins = ['http://127.0.0.1:3000', 'http://192.168.1.10:3000', 'http://localhost:3000',
    'http://127.0.0.1:5500', 'http://192.168.1.10:5500', 'http://localhost:5500',
    'http://127.0.0.1', 'http://192.168.1.10', 'http://localhost'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
let options_static = {
  dotfiles: "allow",
  //allow, deny, ignore
  etag: true,
  extensions: ["htm", "html", "ejs", "js", "css"],
  index: false,
  //to disable directory indexing
  maxAge: "7d",
  redirect: false,
  setHeaders: function (res, path, stat) {
    //add this header to all static responses
    res.set('x-timestamp', Date.now());
  }
};
app.use(`/static`, express.static('app/frontend', options_static));


//---------------------------------------------------------------------------------------


//middleware for cookies
app.use(cookieParser());

// for parsing application/json
app.use(express.json());

// for parsing application/xwww-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// for parsing multipart/form-data  //pakai multer
const multerFile = multer({
  storage: multer.memoryStorage(),
  dest: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" +
      Date.now() + "-" +
      path.extname(file.originalname)
    );
  }
}).array("tmpfile");
app.use(multerFile);


//---------------------------------------------------------------------------------------


console.log(process.env.APP_SECRET); //didapatkan dari set manual var heroku
const port = process.env.PORT || 3000;
const url = process.env.ROOT_URL || "http://localhost/";


//---------------------------------------------------------------------------------------



//start--------------------Menjalankan Routes  [2]

require("./app/broutes/valid.routes.js")(app); //default port dari env atau jika tidak ada di set

app.use(verifyJWT);  //melakukan verfyJWT terlebih dahulu untuk Routes selanjutnya
require("./app/broutes/project.routes.js")(app);

//---------------------------------------------------------------------------------------



let timeStart = new Date().toISOString();
let timesBol = false;
let visitor = 0; //app.get("/deltatime", (req, res) => {

app.get("/", (req, res) => {
  if (timesBol === true) {
    visitor += 1;
    res.json({
      apis: "this Apis can detect your access"
    }); //timesBol = false;  // dibuat turn off agar bernilai false terus
  } else {
    timeStart = new Date().toISOString(); //akan menetapkan waktu awal server mulai

    visitor += 1;
    res.json({
      apis: "this Apis can detect your access"
    });
    timesBol = true;
  }
});
app.get("/infoapp", (req, res) => {
  res.json({
    dateStart: timeStart,
    dateNow: new Date().toString(),
    visitors: visitor,
    dataServer: {
      "nanti-dihilangin": process.env.APP_SECRET,
      "env-port": process.env.PORT,
      "env-url": process.env.ROOT_URL,
      "port": port,
      "url": url
    },
    dataDev: {
      "author": "dnrahmath",
      "github": "https://github.com/dnrahmath",
      "twitter": "https://twitter.com/dnrahmath",
      "telegram-channel": "https://t.me/s/dnrahmath",
      "instagram": "https://instagram.com/dnrahmath",
      "youtube": "https://www.youtube.com/channel/UCHAc5jBOEF8KX348FslexwQ",
      "shopee": "https://shopee.co.id/dnrahmath",
      "tokopedia": "https://www.tokopedia.com/dnrahmath",
      "bukalapak": "https://www.bukalapak.com/u/dnrahmath"
    }
  }); 
});

//done--------------------Menjalankan Routes  [2]



app.listen(port, () => {
  console.log(`------------------------------------------------------`);
  console.log(`Server is running on port ${port}.`);
  console.log(`lokasi file server.js atau directory root =  ${__root}`);
  console.log(`------------------------------------------------------`);
  console.log(`ini untuk nanti di heroku backend`);
  console.log(`------------------------------------------------------`);
  console.log(`${url}`);
  console.log(`------------------------------------------------------`);
  console.log(`http://localhost:${port}/frontend`);
  console.log(`[X] http://192.168.1.10:${port}/frontend`);
  console.log(`------------------------------------------------------`);
});





//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------

exports.app = functions.https.onRequest(app);