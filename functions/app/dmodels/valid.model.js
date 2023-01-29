

const sql = require('../aconfig/dbmodel/db');       

const bcrypt = require('bcryptjs');

const Cryptr = require('cryptr');
const jwt = require('jsonwebtoken');


//const dbConfig = require("../aconfig/db.config");
const appConfig = require("../aconfig/app.config");

const utils = require("../aconfig/utils");



const tbl_name = `tbl_user`;
const roleNumb = 1; //USER biasa dan bukan ADMIN

const UserValid = function (UserVal) {
    this.token_login = UserVal.token_login;
    //--
    this.id_user = UserVal.id_user;
    this.value = UserVal.value;
    this.password = UserVal.password;
    this.modification_time = new Date().getTime();//toISOString()
};





UserValid.register = (validCont, rescookies, result) => {  //diisi customer baru dari [const customer = Customer]

    let sqlTarget = "";
    let media = "";
    if (utils.validateNumber(validCont.value)) { //jika number saja
        media = "phonenumber"; //setelah +62
        sqlTarget = `SELECT JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]') AS loginvia FROM ${tbl_name} 
                    WHERE JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]')=LOWER(${sql.escape(validCont.value)}) 
                    ORDER BY loginvia DESC LIMIT 1; `;
        //let number = utils.selectNumber(validCont.value);
    } else if (utils.validateEmail(validCont.value)) { //jika @ dan . saja
        media = "email";
        sqlTarget = `SELECT JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]') AS loginvia FROM ${tbl_name} 
                    WHERE JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]')=LOWER(${sql.escape(validCont.value)}) 
                    ORDER BY loginvia DESC LIMIT 1; `;
    } else {
        media = "Email dan PhoneNumber tidak valid"; //error
    }

    //dicek apakah media sudah terdaftar atau belum 
    sql.query(sqlTarget, (err, res) => {
        if (res.length) {
            result(err, {
                msg: `Error this user is already in using`
            });
            return;
        } else {
            // jika belum terdaftar akan mulai dijalankan insert
            const salt = bcrypt.genSaltSync(appConfig.TOKEN_HASH_NUMB);
            bcrypt.hash(validCont.password, salt, (err, hash) => {
                if (err) {
                    //console.log("error hash failed internal server error 500", err);
                    result(err, {
                        msg: `error hash failed internal server error 500`
                    });
                    return;
                } else {
                    //sql JSON loginvia ---------------------------------------------------------------------
                    let inisialAllJSON = utils.defaultJSON();

                    //--------- melakukan JSON_SET
                    let setloginviaJSON = ``;
                    if (media == "phonenumber") {
                        //phone
                        setloginviaJSON = inisialAllJSON +
                            `SET @JSONLoginvia := JSON_SET(@JSONLoginvia 
                                 ,"$.loginvia.username[0][0]", "myUser`+ validCont.modification_time + `" 
                                 ,"$.loginvia.contact.phonenumber[0][0]", "`+ validCont.value + `" 
                                 ,"$.loginvia.contact.phonenumber[0][1]", "verify"
                                 ,"$.loginvia.contact.phonenumber[0][2]", "`+ new Date(validCont.modification_time).toLocaleString('en-GB') + `" 
                            );
                        `;
                    } else if (media == "email") {
                        //email
                        setloginviaJSON = inisialAllJSON +
                            `SET @JSONLoginvia := JSON_SET(@JSONLoginvia 
                                 ,"$.loginvia.username[0][0]", "myUser`+ validCont.modification_time + `" 
                                 ,"$.loginvia.contact.email[0][0]", "`+ validCont.value + `" 
                                 ,"$.loginvia.contact.email[0][1]", "verify" 
                                 ,"$.loginvia.contact.email[0][2]", "`+ new Date(validCont.modification_time).toLocaleString('en-GB') + `" 
                                 );
                        `;
                    } else {
                        console.log("media tidak ditemukan");
                    }

                    //sql JSON loginvia ---------------------------------------------------------------------


                    // has hashed pw => add to database
                    let stringQuery = setloginviaJSON +
                        'INSERT INTO ' + tbl_name + ' SET id_user=null' +
                        ', loginvia=@JSONLoginvia' +
                        ', document=@JSONDocument' +
                        ', password=' + sql.escape(hash) +
                        ', numb_role=' + sql.escape(roleNumb) +
                        ', socialmedia=@JSONSocMed' +
                        ', last_login=' + sql.escape(validCont.modification_time) + ';';

                    sql.query( stringQuery, (err, res) => {
                            if (err) {
                                result(err, {
                                    msg: `unable to perform insert query internal server error 500` + err
                                });
                                return;
                            }

                            //-------------------------------
                            //membuat code random4 + bcrypt
                            // 1 dikirim ke JWT TOKEN Client 
                            // 1 dikirim ke melalui send() confirmation  
                            // -> jika sudah verify ->  manual refreshPage()
                            const simpanCode = utils.random();

                            //media saat register hanya (phonenumber/email)
                            //token jwt -----------------------------------
                            const dataJSON = `{
                                "id_user": "${res[4].insertId}",
                                "signinvia": {
                                    "media": "${media}",
                                    "value": "${validCont.value}"
                                },
                                "num_role": "${roleNumb}", 
                                "code": "${simpanCode}"
                            }`;
                            const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSON);
                            //----------------------------
                            //const isToken = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(dataEncrypt);
                            //const isTokenJSON = JSON.parse(isToken);
                            //-----------------------------
                            //decrypt hasil untuk Token ---------

                            

                            //-------------------------------
                            //memberikan Acces tokenJwt
                            const accessToken = jwt.sign(
                                {
                                    "data": dataEncrypt
                                },
                                appConfig.ACCESS.TOKEN_SECRET,
                                { expiresIn: appConfig.ACCESS.TOKEN_EXP } 
                            );
                            const Token = accessToken;
                            
            
                            const newRefreshToken = jwt.sign(
                                {
                                    "data": dataEncrypt,
                                    "token_exp": appConfig.REFRESH.TOKEN_STRING_DATE()
                                },
                                appConfig.REFRESH.TOKEN_SECRET,
                                { expiresIn: appConfig.REFRESH.TOKEN_EXP }  
                            );


                            // memasang token Refresh baru ke cookies
                            rescookies.cookie('Token', newRefreshToken, {
                                httpOnly: true,
                                secure: false, //jika dalam localhost = false
                                sameSite: 'None',
                                maxAge: appConfig.REFRESH.TOKEN_EXP_COOKIE_MAXAGE
                            });
                            //-------------------------------


                            //query akan tetap dieksekusi walaupun err
                            result(err, {
                                msg: `created ${tbl_name} : The user has been registerd with us!`,
                                token: Token,
                                token_exp: appConfig.ACCESS.TOKEN_STRING_DATE()
                                //,isiToken : isTokenJSON
                                //,code: simpanCode
                                //,response: res
                            });
                            return;
                        });
                    //-------------------------------

                }
            });
            //-------------------------------
        }
    });
    //-------------------------------
    return;
};


//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


UserValid.loginGetMod = (validCont, jsonQuery, rescookies, result) => {

    //menghapus cookies JWT terlebih dahulu
    rescookies.clearCookie('Token', {
        httpOnly: true,
        sameSite: 'None',
        secure: false //jika dalam localhost = false
    });

    /*------------------------------------------------------------*/
    let targetArr = [
        ["", ""],
        ["", ""]
    ];

    let methodUse = "";
    let valueTrgt = "";

    const keys = Object.keys(jsonQuery); //mendapatkan JSON key parameter
    for (let i = 0; i < keys.length; i++) { //memasukan semua parameter ke array
        //jika ditemukan == perbarui
        targetArr[i][0] = keys[i];  //namaColumn
        targetArr[i][1] = jsonQuery[keys[i]];  //srcColumn
        //jika == value
        if (keys[i] == "value") {
            valueTrgt = jsonQuery[keys[i]]; //jika value ditemukan maka diperbarui
        }
        //jika == method
        if (keys[i] == "method") {
            methodUse = jsonQuery[keys[i]]; //jika method ditemukan maka diperbarui
        }
    };

    //jika parameter kosong maka error
    if (targetArr[0][0] == "" && targetArr[1][0] == "") {
        result(404, { msg: `query parameters cannot be empty!` });
        return;
    } else if (valueTrgt == "") {
        result(404, { msg: `parameters value cannot be empty!` });
        return;
    }
    /*------------------------------------------------------------*/
    /*------------------------------------------------------------*/


    let sqlTarget = "";
    let media = methodUse;

    if (targetArr[0][0] == "" || targetArr[1][0] == "") {  // cari Username/Email/TelephoneNumber
        if (utils.validateNumber(valueTrgt)) { //jika number saja
            media = "phonenumber";
            sqlTarget = `SELECT JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]') AS loginvia FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]')=LOWER(${sql.escape(valueTrgt)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (utils.validateEmail(valueTrgt)) { //jika @ dan . saja
            media = "email";
            sqlTarget = `SELECT JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]') AS loginvia FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]')=LOWER(${sql.escape(valueTrgt)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (utils.validateUsername(valueTrgt)) {  //jika tidak ditemukan spesial char maka true
            media = "username";
            sqlTarget = `SELECT JSON_VALUE(loginvia, '$.loginvia.username[0][0]') AS loginvia FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.username[0][0]')=LOWER(${sql.escape(valueTrgt)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else {
            media = "tidak ditemukan"; //error bila -> param "" tetapi validasi bukan phonenumber/email/username
        }
        //document -> login berlaku jika  /me  sudah di update
        //kartutandapenduduk,kartupelajar
    } else if (targetArr[0][0] == "method" || targetArr[1][0] == "method") {  // cari kartu-penduduk/kartu-pelajar/berkas-lain
        sqlTarget = `SELECT JSON_VALUE(document, '$.document.${methodUse}.value') AS document FROM ${tbl_name} 
                     WHERE JSON_VALUE(document, '$.document.${methodUse}.value')=LOWER(${sql.escape(valueTrgt)}) 
                     ORDER BY document DESC LIMIT 1; `;
        media = methodUse;
    } else {
        result(404, { msg: `parameter Query Not Found!` });
        return;
    }
    /*------------------------------------------------------------*/






    //dicek apakah media sudah terdaftar atau belum 
    sql.query(sqlTarget, (err, res) => {
        if (!res.length) {
            result(404, {
                msg: `The user was not found!`
            });
            return;
        } else {
            //media dan value => akan di cryptr encrypt
            const dataJSONString = `{
                "mediaLogin": "${media}",
                "value": "${res[0].loginvia}"
            }`;
            const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSONString);

            //membuat token jwt
            const accessLoginToken = jwt.sign(
                {
                    "data": dataEncrypt
                },
                appConfig.ACCESS_LOGIN.TOKEN_SECRET,
                { expiresIn: appConfig.ACCESS_LOGIN.TOKEN_EXP } 
            );
            const loginToken = accessLoginToken;

            //return token
            result(err, {
                msg: `The user was found!`,
                token_login: loginToken,
                token_login_exp: appConfig.ACCESS_LOGIN.TOKEN_STRING_DATE()
            });
            return;
        }
    });
    /*------------------------------------------------------------*/

}


//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


UserValid.loginPostMod = (validCont, jsonQuery, res, result) => {
    // default = dari decode TokenJwt cari Username/Email/TelephoneNumber            dan password
    // methode = dari decode TokenJwt cari kartu-penduduk/kartu-pelajar/berkas-lain  dan password

    /*------------------------------------------------------------*/

    /*
        [GET]
        /in
        /in?value=admin@email.com&method=kartutandapenduduk

        [POST] 
        /in
        (+req.body.token_login.mediaLogin?)  //untuk username/email/phonenumber  ||  kartutandapenduduk/NPM/KartuPelajar/KIA/PASSPORT
        (+req.body.token_login.value?)
        (+req.body.password)

        dibagian register ajh ada validasi KTP/KartuPelajar 
          -> untuk login dijadikan 1 bagian ajh yaitu login dengan berkas
    */
    /*------------------------------------------------------------*/


    let decoded = "";
    // invalid token - synchronous
    try {
        decoded = jwt.verify(validCont.token_login, appConfig.ACCESS_LOGIN.TOKEN_SECRET);
    } catch(err) {
        return res.status(403).send({
            message: `Expired token!`
        });
    }
    

    const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
    const dataJSONParse = JSON.parse(dataDecrypt);

    /*------------------------------------------------------------*/
    let sqlTarget = "";
    if (dataJSONParse.mediaLogin == "phonenumber" || dataJSONParse.mediaLogin == "email" || dataJSONParse.mediaLogin == "username") {  // cari Username/Email/TelephoneNumber
        if (dataJSONParse.mediaLogin == "phonenumber") { //jika number saja
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]')=LOWER(${sql.escape(dataJSONParse.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (dataJSONParse.mediaLogin == "email") { //jika @ dan . saja
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]')=LOWER(${sql.escape(dataJSONParse.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (dataJSONParse.mediaLogin == "username") {  //jika tidak ditemukan spesial char maka true
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE JSON_VALUE(loginvia, '$.loginvia.username[0][0]')=LOWER(${sql.escape(dataJSONParse.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else {
            //error
        }
    } else {  // cari kartu-penduduk/kartu-pelajar/berkas-lain
        sqlTarget = `SELECT * FROM ${tbl_name} 
                     WHERE JSON_VALUE(document, '$.document.${dataJSONParse.mediaLogin}.value')=LOWER(${sql.escape(dataJSONParse.value)}) 
                     ORDER BY document DESC LIMIT 1; `;
    }
    /*------------------------------------------------------------*/



    //sql sebelumnya
    //`SELECT * FROM ${tbl_name} WHERE email = ${sql.escape(validCont.email)};`

    //diganti JSON

    //mencari email tersedia atau tidak
    sql.query(sqlTarget, (err, results) => {
        // user does not exists
        if (err) {
            result(err, {
                msg: `error 0`,
                error: err
            });
            return;
        }
        if (!results.length) { //!
            result(err, {
                msg: `Target Not Found!`
                //,error: results[0]
            });
            return;
        }


        // check password
        bcrypt.compare(validCont.password, results[0]['password'], (bErr, bResult) => {
            // wrong password
            if (bErr) {
                result(401, {
                    msg: `error hash password incorrect : ` + bErr
                });
                return;
            }
            if (bResult) {

                //token jwt -----------------------------------
                const dataJSON = `{
                    "id_user": "${results[0].id_user}",
                    "signinvia": {
                        "media": "${dataJSONParse.mediaLogin}",
                        "value": "${dataJSONParse.value}"
                    },
                    "num_role": "${roleNumb}", 
                    "code": "-"
                }`;
                const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSON);
                

                

                const accessToken = jwt.sign(
                    {
                        "data": dataEncrypt
                    },
                    appConfig.ACCESS.TOKEN_SECRET,
                    { expiresIn: appConfig.ACCESS.TOKEN_EXP } 
                );
                const Token = accessToken;
                

                const newRefreshToken = jwt.sign(
                    {
                        "data": dataEncrypt,
                        "token_exp": appConfig.REFRESH.TOKEN_STRING_DATE()
                    },
                    appConfig.REFRESH.TOKEN_SECRET,
                    { expiresIn: appConfig.REFRESH.TOKEN_EXP }  
                );


                // memasang token Refresh baru ke cookies
                res.cookie('Token', newRefreshToken, {
                    httpOnly: true,
                    secure: false, //jika dalam localhost = false
                    sameSite: 'None',
                    maxAge: appConfig.REFRESH.TOKEN_EXP_COOKIE_MAXAGE 
                });


                //melakukan update pada column last_login waktu ketika login
                //berbeda dengan table loginvia
                sql.query(`UPDATE ${tbl_name} SET last_login = '${new Date().getTime()}' WHERE id_user = '${results[0].id_user}'`);



                // response JSON ---------------------------------------

                //nanti dipasang di header Authorization = token JWT ACCESS_TOKEN
                result(null, {
                    msg: `Logged in!`,
                    token: Token,
                    token_exp: appConfig.ACCESS.TOKEN_STRING_DATE()
                });

                return;
            }

            result(401, {
                msg: `Password is incorrect!`
            });
            return;
        });

        //--------------------------------------------------

    });
    //-------------------------------

    //model -> jwt.sign [membuatbaru] -> cookies + header

}


//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~

UserValid.refreshMod = (refreshToken, res, result) => {

    // ketika selesai login / register -> akan mendapatkan cookies
    // cookies digunakan untuk keperluan refresh token
    // sync cookies atau memang otomatis
    jwt.verify(
        refreshToken,
        appConfig.REFRESH.TOKEN_SECRET,
        async (err, decoded) => {

            //jika error
            if (err) {
                return result(403, {
                    message: `Expired token!`
                });
            }

            //----------------------------
            const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
            const dataJSONParse = JSON.parse(dataDecrypt);
            //-----------------------------
            //decrypt hasil Refresh Token ---------

            const dataJSON = `{
              "id_user": "${dataJSONParse.id_user}",
              "signinvia": {
                  "media": "${dataJSONParse.signinvia.media}",
                  "value": "${dataJSONParse.signinvia.value}"
              },
              "num_role": "${dataJSONParse.num_role}", 
              "code": "-"
            }`;
            const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSON);


            //----------------------------
            //const isiAccessToken = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(dataEncrypt);
            //const isiAccessTokenJSON = JSON.parse(isiAccessToken);
            //-----------------------------
            //decrypt hasil Refresh Token untuk Access Token ---------

            const accessToken = jwt.sign(
                {
                    "data": dataEncrypt
                },
                appConfig.ACCESS.TOKEN_SECRET,
                { expiresIn: appConfig.ACCESS.TOKEN_EXP } 
            );
            const Token = accessToken;



            res.json({ 
              token : Token,
              token_exp: appConfig.ACCESS.TOKEN_STRING_DATE()
              //,previousToken : dataJSONParse
              //,newToken : isiAccessTokenJSON 
            });  //nanti dipasang di header Authorization
            
            //--------------------------------------
        }
    );

};

//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


UserValid.logout = (req, rescookies, result) => {

    //menghapus cookies JWT -> agar diarahkan Login
    rescookies.clearCookie('Token', {
        httpOnly: true,
        sameSite: 'None',
        secure: false //jika dalam localhost = false
    });

    //megecek token sudah terhapus atau belum
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        //tidak perlu di verify karena data didalam token akan dihapus akhirnya
        result(null, {
            message: 'kamu sudah logout dan silahkan login'
        });
        return;
    }
    //-------------------------------

    result(null, {
        message: `kamu baru saja logout `,
        auth: false,
        token: null
    });
    return;

}




//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~

//ketika melakukan GET /me -> akan mendapatkan pass di token authorization
//tetapi ketika GET  /register - /in - /refresh -> tidak akan mendapat pass
UserValid.getMeMod = (req, result) => {

    // mengecek token tersedia tidak untuk mendapatkan akses
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return result(401, {msg: `Token not found, Please login first!`});
    }
    // mendapatkan keseluruhan data account
    const theToken = req.headers.authorization.split(' ')[1];
    //-------------------------------

    let decoded = "";
    // invalid token - synchronous
    try {decoded = jwt.verify(theToken, appConfig.ACCESS.TOKEN_SECRET);} 
    catch(err) {return result(403, {msg: `Expired token!`});}
    //-------------------------------

    //membuka cryptr -> menjadikan JSON
    const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
    const dataJSONParse = JSON.parse(dataDecrypt);
    //console.log(dataJSONParse);  //isi didalam token
    
    /*------------------------------------------------------------*/
    let sqlTarget = "";
    if (dataJSONParse.signinvia.media == "phonenumber" || dataJSONParse.signinvia.media == "email" || dataJSONParse.signinvia.media == "username") {  // cari Username/Email/TelephoneNumber
        if (dataJSONParse.signinvia.media == "phonenumber") { //jika number saja
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE id_user=${dataJSONParse.id_user} AND 
                        JSON_VALUE(loginvia, '$.loginvia.contact.phonenumber[0][0]')=LOWER(${sql.escape(dataJSONParse.signinvia.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (dataJSONParse.signinvia.media == "email") { //jika @ dan . saja
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE id_user=${dataJSONParse.id_user} AND 
                        JSON_VALUE(loginvia, '$.loginvia.contact.email[0][0]')=LOWER(${sql.escape(dataJSONParse.signinvia.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else if (dataJSONParse.signinvia.media == "username") {  //jika tidak ditemukan spesial char maka true
            sqlTarget = `SELECT * FROM ${tbl_name} 
                        WHERE id_user=${dataJSONParse.id_user} AND 
                        JSON_VALUE(loginvia, '$.loginvia.username[0][0]')=LOWER(${sql.escape(dataJSONParse.signinvia.value)}) 
                        ORDER BY loginvia DESC LIMIT 1; `;
        } else {
            //error
        }
    } else {  // cari kartu-penduduk/kartu-pelajar/berkas-lain
        sqlTarget = `SELECT * FROM ${tbl_name} 
                     WHERE id_user=${dataJSONParse.id_user} AND 
                     JSON_VALUE(document, '$.document.${dataJSONParse.signinvia.media}[0]')=LOWER(${sql.escape(dataJSONParse.signinvia.value)}) 
                     ORDER BY document DESC LIMIT 1; `;
    }
    /*------------------------------------------------------------*/

    sql.query(sqlTarget, (err, results, fields) => {
        if (!results.length) {
            result(404, {
                msg: `The user was not found!`
            });
            return;
        } else {
            //menambahkan password ke authorization 
            const dataJSON = `{
              "id_user": "${dataJSONParse.id_user}",
              "signinvia": {
                  "media": "${dataJSONParse.signinvia.media}",
                  "value": "${dataJSONParse.signinvia.value}"
              },
              "num_role": "${results[0].numb_role}", 
              "code": "-",
              "pass": "${results[0].password}"
            }`;
            const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSON);
  

            //membuat jwt token
            const accessToken = jwt.sign(
                {
                    "data": dataEncrypt
                },
                appConfig.ACCESS.TOKEN_SECRET,
                { expiresIn: appConfig.ACCESS.TOKEN_EXP } 
            );
            const Token = accessToken;
  

            //bentuk json harus di parse dulu baru bisa dibentuk
            const resloginvia = JSON.parse(results[0].loginvia); 
            const resdocument = JSON.parse(results[0].document);
            const ressocialmedia = JSON.parse(results[0].socialmedia);
    
            result(err, {
                error: err,
                msg: `Fetch Successfully.`,
                token : Token,
                token_exp: appConfig.ACCESS.TOKEN_STRING_DATE(),
                data: {
                    "id_user": results[0].id_user,
                    "loginvia": resloginvia.loginvia,
                    "document": resdocument.document,
                    "password": results[0].password,
                    "num_role": results[0].numb_role,
                    "socialmedia": ressocialmedia.socialmedia,
                    "last_login": results[0].last_login
                }
            });
            
            return;
        }
    });
    //-------------------------------
}

//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~

UserValid.insertDataMod = (req, result) => {
    // mengecek token tersedia tidak untuk mendapatkan akses
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return result(401, {msg: `Token not found, Please login first!`});
    }
    // mendapatkan keseluruhan data account
    const theToken = req.headers.authorization.split(' ')[1];
    //-------------------------------

    let decoded = "";
    // invalid token - synchronous
    try {decoded = jwt.verify(theToken, appConfig.ACCESS.TOKEN_SECRET);} 
    catch(err) {return result(403, {msg: `Expired token!`});}
    const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
    const dataJSONParse = JSON.parse(dataDecrypt);

    const iduser = dataJSONParse.id_user;
    //Hasil dari decode auth -> adan menentukan target WHERE
    //-------------------------------

    
    const mainColm = ["loginvia","document","password","numb_role","socialmedia"]; //kode yg dipakai di parameter
    const loginviaColm = ["username","contact.email","contact.phonenumber","e-wallet.metamask","thirdapp.google","thirdapp.facebook"];
    const documentColm = ["identityCard","studentCard"];
    //socialmedia 0 IF => ALL Update

    //const trgtType = typeof req.query.target;  //string
    //const trgtPutType = typeof req.query.put;  //string
    const trgt = Number(req.query.target);  // mainColm
    const trgtPut = Number(req.query.put);  // loginviaColm,documentColm,socialmedia
    

    //mengubah req.body menjadi Array 2D -----------------------
    const data = req.body; 
    const keysObj = Object.keys(data); //mendapatkan JSON key parameter
    let ArrBody = Array(keysObj.length).fill().map(() => Array(2)); //membuat Array 2D
    for (let i = 0; i < keysObj.length; i++) { //memasukan semua parameter ke array
        ArrBody[i][0] = keysObj[i];  //namaColumn
        ArrBody[i][1] = data[keysObj[i]];  //srcColumn
        if (ArrBody[i][0].match(/data/i)) { //jika ditemukan "data" | req.body.data??
            let getNumb = ArrBody[i][0].substring(4); // ubah => data21 -> 21
            ArrBody[i][0] = getNumb;
        } else {} //jika tidak ada kata "data" maka tidak dilakukan apapun 
    };
    //-------------------------------------------------
    
    const short = utils.sortingAsc(ArrBody); //diurutkan jika berantakan
    const arrFormatSql = utils.sqlFormatArr(short); //output String SQL ARRAY
    
    //-------------------------------------------------
    let sqlTarget = ``;
    for (let i = 0; i < mainColm.length; i++) { //antara 0-4
        if (isNaN(trgt) || trgt > mainColm.length) { //jika bukan number atau lebih dari param
            return result(406, {msg: `Target value not acceptable!`});
        };
        
        if (trgt == 0) { //loginvia
            for (let j = 0; j < loginviaColm.length; j++) { //antara 0-5
                if (isNaN(trgtPut) || trgtPut > loginviaColm.length) { //jika bukan number atau lebih dari param
                    return result(406, {msg: `Target value not acceptable!`});
                };
    
                if (trgtPut == j) { //hanya dipilih 1
                    const oneCol = mainColm[trgt]; //loginvia
                    const twoCol = loginviaColm[trgtPut]; 
                        //menentukan email[?] , phonenumber[?]                              
                        //menentukan username[0] , metamask[0] , google[0] , facebook[0]    
                    sqlTarget = `SET @target= (${iduser});
                                 SET @newInsert = (
                                   SELECT JSON_ARRAY_APPEND(${oneCol}, '$.${oneCol}.${twoCol}', ${arrFormatSql}) FROM tbla_user
                                   WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                                 );
                                 UPDATE tbla_user SET ${oneCol}=@newInsert
                                 WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                                `;
                };
            }
        } else if (trgt == 1) { //document
            const oneCol = mainColm[trgt]; //document
            sqlTarget = `SET @target= (${iduser});
                         SET @newInsert = (
                           SELECT JSON_ARRAY_APPEND(${oneCol}, '$.${oneCol}', ${arrFormatSql}) FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newInsert
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;                              
                        `;
        } else if (trgt == 4) { //socialmedia
            const oneCol = mainColm[trgt]; //socialmedia
            sqlTarget = `SET @target= (${iduser});
                         SET @newInsert = (
                           SELECT JSON_ARRAY_APPEND(${oneCol}, '$.${oneCol}', ${arrFormatSql}) FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newInsert
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                        `;
        } else if (trgt == 2 || trgt == 3){ //antara 2-3 ["password"-"numb_role"]
            //GUNAKAN METHOD PUT
            return result(405, {msg: `Method Not Allowed!`});
        }
    }

    //console.log(sqlTarget); //data sqlQuery

    //--------------------------------------------------------------------------

    //isian
    sql.query(sqlTarget, (err, results) => {
        if (err) {
            return result(err, {
                msg: `unable to perform insert query internal server error 500` + err
            });
        }

        if (!results.length) {
            return result(404, {msg: `The user was not found!`});
        } else {
            return result(err, {msg: `data has been inserted!`});
        }
    });

    //--------------------------------------------------------------------------
}


//setelah melakukan update password , jangan lupa perbarui token
UserValid.editDataMod = (req, result) => {

    //---------------------------------------------------------------

    // mengecek token tersedia tidak untuk mendapatkan akses
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return result(401, {msg: `Token not found, Please login first!`});
    }
    // mendapatkan keseluruhan data account
    const theToken = req.headers.authorization.split(' ')[1];
    //-------------------------------

    let decoded = "";
    // invalid token - synchronous
    try {decoded = jwt.verify(theToken, appConfig.ACCESS.TOKEN_SECRET);} 
    catch(err) {return result(403, {msg: `Expired token!`});}
    const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
    const dataJSONParse = JSON.parse(dataDecrypt);

    //Hasil dari decode auth -> adan menentukan target WHERE
    const iduser = dataJSONParse.id_user;
    const myrole = dataJSONParse.num_role;
    const pass = dataJSONParse.pass; //hasil GET /me

    //-------------------------------

    
    const mainColm = ["loginvia","document","password","numb_role","socialmedia"]; //kode yg dipakai di parameter
    const loginviaColm = ["username","contact.email","contact.phonenumber","e-wallet.metamask","thirdapp.google","thirdapp.facebook"];
    //const documentColm = ["identityCard","studentCard"];
    //socialmedia 0 IF => ALL Update

    //const trgtType = typeof req.query.target;  //string
    //const trgtPutType = typeof req.query.put;  //string
    const trgt = Number(req.query.target);  // mainColm
    const trgtPut = Number(req.query.put);  // loginviaColm,documentColm,socialmedia
    
    //Target
    const indexTarget = Number(req.query.index);
    //password
    let passHash =``;
    //numb_role , auth = myrole
    const targetIdUser = Number(req.query.iduser);

    //mengubah req.body menjadi Array 2D -----------------------
    const data = req.body; 
    const keysObj = Object.keys(data); //mendapatkan JSON key parameter
    let ArrBody = Array(keysObj.length).fill().map(() => Array(2)); //membuat Array 2D
    for (let i = 0; i < keysObj.length; i++) { //memasukan semua parameter ke array
        ArrBody[i][0] = keysObj[i];  //namaColumn
        ArrBody[i][1] = data[keysObj[i]];  //srcColumn
        if (ArrBody[i][0].match(/data/i)) { //jika ditemukan "data" | req.body.data??
            let getNumb = ArrBody[i][0].substring(4); // ubah => data21 -> 21
            ArrBody[i][0] = getNumb;
        } else {} //jika tidak ada kata "data" maka tidak dilakukan apapun 
    };
    //-------------------------------------------------
    

    const short = utils.sortingAsc(ArrBody); //diurutkan jika berantakan
    const arrFormatSql = utils.sqlFormatArr(short); //output String SQL ARRAY
    

    //-------------------------------------------------

    let sqlTarget = ``;
    for (let i = 0; i < mainColm.length; i++) { //antara 0-4
        if (isNaN(trgt) || trgt > mainColm.length) { //jika bukan number atau lebih dari param
            return result(406, {msg: `Target value not acceptable!`});
        }; 
        
        if (trgt == 0) { //loginvia
            for (let j = 0; j < loginviaColm.length; j++) { //antara 0-5
                if (isNaN(indexTarget) || isNaN(trgtPut) || trgtPut > loginviaColm.length) { //jika bukan number atau lebih dari param
                    return result(406, {msg: `Target value not acceptable!`});
                };
    
                if (trgtPut == j) { //hanya dipilih 1
                    const oneCol = mainColm[trgt]; //loginvia
                    const twoCol = loginviaColm[trgtPut]; 
                        //menentukan email[?] , phonenumber[?]                              
                        //menentukan username[0] , metamask[0] , google[0] , facebook[0]    
                        sqlTarget = `SET @target= (${iduser});
                                     SET @newEdit = (
                                       SELECT JSON_REPLACE(${oneCol}, '$.${oneCol}.${twoCol}[${indexTarget}]', ${arrFormatSql}) FROM tbla_user
                                       WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                                     );
                                     UPDATE tbla_user SET ${oneCol}=@newEdit
                                     WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                                    `;
                };
            }
        //[+]PENTING - ubah sql WHERE jadi by id_user AND document[][0] = value (kalo bisa)
        //atau dari frontend input index baris (hasil looping number) saja
        } else if (trgt == 1) { //document
            if (isNaN(indexTarget)) { //jika bukan number
                return result(406, {msg: `Target value not acceptable!`});
            };

            const oneCol = mainColm[trgt]; //document
            sqlTarget = `SET @target= (${iduser});
                         SET @newEdit = (
                           SELECT JSON_REPLACE(${oneCol}, '$.${oneCol}[${indexTarget}]', ${arrFormatSql}) FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newEdit
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                        `;
                
            
        } else if (trgt == 4) { //socialmedia
            if (isNaN(indexTarget)) { //jika bukan number
                return result(406, {msg: `Target value not acceptable!`});
            };
            
            const oneCol = mainColm[trgt]; //socialmedia
            sqlTarget = `SET @target= (${iduser});
                         SET @newEdit = (
                           SELECT JSON_REPLACE(${oneCol}, '$.${oneCol}[${indexTarget}]', ${arrFormatSql}) FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newEdit
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                        `;
        } else if (trgt == 2 || trgt == 3){ //antara 2-3 ["password"-"numb_role"]
            if (trgt == 2 && trgt == i) { //password
                //dibuat jadi HASH !!
                const putDataOld = short[0][1]; //req.body.data1 //password baru
                const putDataNew = short[1][1]; //req.body.data1 //password baru
                passHash = "";

                const checkPass = bcrypt.compareSync(putDataOld, pass); //password baru = password lama
                if(checkPass) { //jika true
                    const salt = bcrypt.genSaltSync(appConfig.TOKEN_HASH_NUMB);
                    passHash = bcrypt.hashSync(putDataNew, salt); //password baru dijadikan HASH
                }else{
                    return result(403, {msg: `Wrong password!`});
                }

                //--
                const oneCol = mainColm[trgt]; 
                sqlTarget = `UPDATE tbla_user SET ${oneCol}=${sql.escape(passHash)}
                             WHERE id_user=${sql.escape(iduser)} ORDER BY ${oneCol} DESC LIMIT 1;
                            `;
                //[*] Jika mau Cek Password berubah atau tidak -> perbarui autorization
                //--

            } else if (trgt == 3 && trgt == i) { //numb_role [ADMIN] tidak akan berubah di TOKEN
                //---
                const dataBody = Number(short[0][1]); //req.body.data0
                if (isNaN(dataBody) || isNaN(targetIdUser)) { //jika bukan number 
                    return result(406, {msg: `Target value not acceptable!`});
                };

                let vrole = ``; 
                const oneCol = mainColm[trgt]; 

                if(3 == myrole){  //jika role ADMIN  //nanti == |  ADMIN 3 == myrole 3
                    vrole = dataBody;
                }else{  //jika role bukan ADMIN
                    return result(403, {msg: `You are not allowed to take action!`});
                }

                sqlTarget = `SET @target= (${targetIdUser});
                             UPDATE tbla_user SET ${oneCol}=${sql.escape(vrole)}
                             WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                            `;
            };
        }
    }

    //console.log(sqlTarget); //data sqlQuery

    //--------------------------------------------------------------------------

    //isian
    sql.query(sqlTarget, (err, results) => {
        //menambahkan password ke authorization 
        const dataJSON = `{
          "id_user": "${dataJSONParse.id_user}",
          "signinvia": {
              "media": "${dataJSONParse.signinvia.media}",
              "value": "${dataJSONParse.signinvia.value}"
          },
          "num_role": "${dataJSONParse.num_role}", 
          "code": "-",
          "pass": "${passHash}"
        }`;
        const dataEncrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).encrypt(dataJSON);


        //membuat jwt token
        const accessToken = jwt.sign(
            {
                "data": dataEncrypt
            },
            appConfig.ACCESS.TOKEN_SECRET,
            { expiresIn: appConfig.ACCESS.TOKEN_EXP } 
        );
        const Token = accessToken;


        //new 
        if (err) {
            return result(err, {
                msg: `unable to perform insert query internal server error 500` + err
            });
        }else{
            return result(err, {
                error: err,
                msg: `data has been updated!`,
                token : Token,
                token_exp: appConfig.ACCESS.TOKEN_STRING_DATE()
            });
        }

    });

    //--------------------------------------------------------------------------

}


UserValid.deleteDataMod = (req, result) => {

    //---------------------------------------------------------------

    // mengecek token tersedia tidak untuk mendapatkan akses
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer') || !req.headers.authorization.split(' ')[1]) {
        return result(401, {msg: `Token not found, Please login first!`});
    }
    // mendapatkan keseluruhan data account
    const theToken = req.headers.authorization.split(' ')[1];
    //-------------------------------

    let decoded = "";
    // invalid token - synchronous
    try {decoded = jwt.verify(theToken, appConfig.ACCESS.TOKEN_SECRET);} 
    catch(err) {return result(403, {msg: `Expired token!`});}
    const dataDecrypt = new Cryptr(appConfig.TOKEN_ENCRYPTION).decrypt(decoded.data);
    const dataJSONParse = JSON.parse(dataDecrypt);

    //Hasil dari decode auth -> adan menentukan target WHERE
    const iduser = dataJSONParse.id_user;
    //-------------------------------

    
    const mainColm = ["loginvia","document","password","numb_role","socialmedia"]; //kode yg dipakai di parameter
    const loginviaColm = ["username","contact.email","contact.phonenumber","e-wallet.metamask","thirdapp.google","thirdapp.facebook"];
    //const documentColm = ["identityCard","studentCard"];
    //socialmedia 0 IF => ALL Update

    //const trgtType = typeof req.query.target;  //string
    //const trgtPutType = typeof req.query.put;  //string
    const trgt = Number(req.query.target);  // mainColm
    const trgtPut = Number(req.query.put);  // loginviaColm,documentColm,socialmedia
    
    //Target
    const indexTarget = Number(req.query.index);

    //-------------------------------------------------

    let sqlTarget = ``;
    for (let i = 0; i < mainColm.length; i++) { //antara 0-4
        if (isNaN(trgt) || trgt > mainColm.length) { //jika bukan number atau lebih dari param
            return result(406, {msg: `Target value not acceptable!`});
        }; 
        
        if (trgt == 0) { //loginvia
            for (let j = 0; j < loginviaColm.length; j++) { //antara 0-5
                if (isNaN(indexTarget) || isNaN(trgtPut) || trgtPut > loginviaColm.length) { //jika bukan number atau lebih dari param
                    return result(406, {msg: `Target value not acceptable!`});
                };
    
                if (trgtPut == j) { //hanya dipilih 1
                    const oneCol = mainColm[trgt]; //loginvia
                    const twoCol = loginviaColm[trgtPut]; 
                        //menentukan email[?] , phonenumber[?]                              
                        //menentukan username[0] , metamask[0] , google[0] , facebook[0] 
                        sqlTarget = `SET @target= (${iduser});
                                     SET @newRemove= (
                                       SELECT JSON_REMOVE(${oneCol}, '$.${oneCol}.${twoCol}[${indexTarget}]') FROM tbla_user
                                       WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                                     );
                                     UPDATE tbla_user SET ${oneCol}=@newRemove
                                     WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                                    `;
                };
            }
        } else if (trgt == 1) { //document
            if (isNaN(indexTarget)) { //jika bukan number
                return result(406, {msg: `Target value not acceptable!`});
            };

            const oneCol = mainColm[trgt]; //document
            sqlTarget = `SET @target= (${iduser});
                         SET @newRemove= (
                           SELECT JSON_REMOVE(${oneCol}, '$.${oneCol}[${indexTarget}]') FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newRemove
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                        `;
                
            
        } else if (trgt == 4) { //socialmedia
            if (isNaN(indexTarget)) { //jika bukan number
                return result(406, {msg: `Target value not acceptable!`});
            };
            
            const oneCol = mainColm[trgt]; //socialmedia
            sqlTarget = `SET @target= (${iduser});
                         SET @newRemove= (
                           SELECT JSON_REMOVE(${oneCol}, '$.${oneCol}[${indexTarget}]') FROM tbla_user
                           WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1
                         );
                         UPDATE tbla_user SET ${oneCol}=@newRemove
                         WHERE id_user=@target ORDER BY ${oneCol} DESC LIMIT 1;
                        `;
        } else if (trgt == 2 || trgt == 3){ //antara 2-3 ["password"-"numb_role"]
            //GUNAKAN METHOD PUT
            return result(405, {msg: `Method Not Allowed!`});
        }
    }

    //console.log(sqlTarget); //data sqlQuery


    //--------------------------------------------------------------------------

    //isian
    sql.query(sqlTarget, (err, results) => {

        if (err) {
            return result(err, {
                msg: `unable to perform insert query internal server error 500` + err
            });
        }else{
            return result(err, {msg: `data has been deleted!`});
        }

    });

    //--------------------------------------------------------------------------


}

//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~
  

  



module.exports = UserValid;