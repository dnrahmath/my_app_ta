module.exports = app => {

    const ValCon = require("../ccontrollers/valid.controller");  // menjalankan function didalam controller 

    const { signupValidation, loginValidation } = require('../aconfig/valid');
  
    app.post(`/reg`, signupValidation, ValCon.register);
    
    app.get(`/check`, loginValidation, ValCon.loginGet);  //get jwttoken , loginvia tersedia
    app.post(`/in`, loginValidation, ValCon.loginPost);  //post password

    app.post(`/refresh`, ValCon.refresh);
    app.post(`/out`, signupValidation, ValCon.logout);

    //-------------

    app.get(`/me`, signupValidation, ValCon.getMe); //select
  
    //-------------

    app.post(`/me`, ValCon.insertData); 
    app.put(`/me`, ValCon.editData); 
    app.delete(`/me`, ValCon.deleteData); 
  
    //-------------
    
    //[PENTING]
    //jika router tidak ditemukan maka Forbidden ? 
  
  /*
    #ADMIN
    [ PUT numb_role ]

    #USER
    [ PUT loginvia ]
    [ PUT document ] (buffer)
    [ PUT password ]
    [ PUT socialmedia ]
    
    app.put(`/me`, ValCon.update);  //update -> save Account   [ POST New || GET Previous ]
    app.delete(`/me`, ValCon.delete);  //delete -> delete Account
  */
  };
  
  
