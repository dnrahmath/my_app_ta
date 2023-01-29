

//--------------------Memanggil Model  [4] 
const jwt = require('jsonwebtoken'); 
const appConfig = require("../aconfig/app.config");

const Cryptr = require('cryptr');

const validMod = require("../dmodels/valid.model");  // menjalankan function buatan didalam model

//--------------------"Message dari hasil pemangilan dari model"



exports.register = (req, res, next) => {
    
    // cek req tidak kosong
    if (!req.body) {
      res.status(400).send({
        message: `Content can not be empty!`
      });
    }

    //--------------------

    // -
    validMod.register(
      new validMod(req.body),
      res, 
      (err, data) => {
      if (err == 409)
        res.status(409).send({
          message:
            data.msg || `This user is already in using.`
        });
      //if (err == 500)
      //  res.status(500).send({
      //    message:
      //      data.msg || `Some error detect return.`
      //  });
      else if (err) 
          res.status(500).send({
            message:
              data.msg || `Some error occurred while creating the.`
          });
      else res.send(data);
    });
};



 //~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~

 exports.loginGet = (req, res, next) => {
    
  validMod.loginGetMod(new validMod(req.body), req.query, res, (err, data) => {
      if (err) {
        res.status(err).send({
          message: data.msg || `error dari model .`
        });
      } else {
        res.send(data)
      };
    }
  );

  //model -> jwt.sign [membuatbaru] -> cookies + header

};


 //~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


exports.loginPost = (req, res, next) => {
    
    // cek req tidak kosong
    if (!req.body) {
      res.status(400).send({
        message: `Content can not be empty!`
      });
    }

    //--------------------

    validMod.loginPostMod(new validMod(req.body), req.query, res, (err, data) => {
        if (err) {
          res.status(err).send({
            message: data.msg || `error dari model .`
          });
        } else {
          res.send(data)
        };
      }
    );

    //model -> jwt.sign [membuatbaru] -> cookies + header

};


//jika header Authorization == expired maka ->
//membuat ACCESS_TOKEN_SECRET baru dengan memvalidasi REFRESH_TOKEN_SECRET
exports.refresh = (req, res, next) => {
    const cookies = req.cookies;
    if (!cookies?.Token) return res.sendStatus(401); //jika cookie tidak ditemukan MAKA Erorr
    const refreshToken = cookies.Token;  //mendapatkan cookies sebelum dihapus -> jwt.verify

    validMod.refreshMod(refreshToken, res, (err, data) => {
        if (err) {
          res.status(err).send({
            message: data.msg || `error dari model .`
          });
        } else {
          res.send(data)
        };
      }
    );

};



exports.logout = (req, res, next) => {
    
    // cek req tidak kosong
    if (!req.body) {
      res.status(400).send({
        message: `Content can not be empty!`
      });
    }

    //--------------------

    validMod.logout(req, res, (err, data) => {
        if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found users with .`
            });
          } else {
            res.status(500).send({
              message: `Error get users with .`
            });
          }
        } else res.send(data);
      }
    );

};



//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


exports.getMe = (req, res, next) => {  //route refresh

   //token expired detect
   //invalid signature token

   validMod.getMeMod(req, (err, data) => {
      if (err) {
        res.status(err).send({
          message: data.msg || `error dari model .`
        });
      } else {
        res.send(data)
      };
     }
   );

   //model -> jwt.verfy -> jwt.sign [memperbarui] -> cookies + header

};

//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~


exports.insertData = (req, res, next) => {  //route refresh
  validMod.insertDataMod(req, (err, data) => {
     if (err) {
       res.status(err).send({
         message: data.msg || `error dari model .`
       });
     } else {
       res.send(data)
     };
    }
  );
};


exports.editData = (req, res, next) => {  //route refresh
  validMod.editDataMod(req, (err, data) => {
     if (err) {
       res.status(err).send({
         message: data.msg || `error dari model .`
       });
     } else {
       res.send(data)
     };
    }
  );
};


exports.deleteData = (req, res, next) => {  //route refresh
  validMod.deleteDataMod(req, (err, data) => {
     if (err) {
       res.status(err).send({
         message: data.msg || `error dari model .`
       });
     } else {
       res.send(data)
     };
    }
  );
};


//~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~8~~8~8~8~8~~~~~~

