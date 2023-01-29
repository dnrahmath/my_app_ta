class utils{
    constructor(){}
    
    random = () => {
        const data1 = Math.floor(Math.random() * 10).toString();
        const data2 = Math.floor(Math.random() * 10).toString();
        const data3 = Math.floor(Math.random() * 10).toString();
        const data4 = Math.floor(Math.random() * 10).toString();
        const random4number = data1+data2+data3+data4; 
        return random4number
    }
    
    defaultJSON = () => {
        const JSON = 
        `SET @JSONSocMed = JSON_OBJECT(
          "socialmedia",JSON_ARRAY(
            JSON_ARRAY("instagram","https://"),
            JSON_ARRAY("twitter","https://"),
            JSON_ARRAY("telegram","https://"),
            JSON_ARRAY("facebook","https://")
          ),
          "socialmedia-version","1.00" 
        );
        SET @JSONDocument = JSON_OBJECT(
           "document",JSON_ARRAY(
             JSON_ARRAY("-","-","-","-","-","-","-"), 
             JSON_ARRAY("-","-","-","-","-","-","-") 
           ),
           "document-version","1.00" 
        );
        SET @JSONLoginvia = JSON_OBJECT(
          "loginvia",JSON_OBJECT(
            "username",JSON_ARRAY(
              JSON_ARRAY("-","-","-")
            ),
            "contact",JSON_OBJECT(
              "email",JSON_ARRAY(
                JSON_ARRAY("-","-","-"),
                JSON_ARRAY("-","-","-")
              ),
              "phonenumber",JSON_ARRAY(
                JSON_ARRAY("-","-","-"),
                JSON_ARRAY("-","-","-")
              )
            ),
            "e-wallet",JSON_OBJECT(
              "metamask",JSON_ARRAY(
                JSON_ARRAY("-","-","-")
              )
            ),
            "thirdapp",JSON_OBJECT(
              "google",JSON_ARRAY(
                JSON_ARRAY("-","-","-")
              ),
              "facebook",JSON_ARRAY(
                JSON_ARRAY("-","-","-")
              )
            )
          ),
          "loginvia-version","1.00" 
        );
          `;
        return JSON;
    }
    //---------------------------------------------------------
    sortingAsc = (arr) => { //insertionSort  //shorting Array 2d
      for(let n = 1; n < arr.length; n++){
          let currenta = arr[n][0];
          let currentb = arr[n][1];
          let j = n - 1;
          while(j >= 0 && arr[j][0] > currenta){ //pengurutan Ascending(>) , Descending(<)
              arr[j + 1][0] = arr[j][0];
              arr[j + 1][1] = arr[j][1];
              j = j - 1;
          }
          arr[j + 1][0] = currenta;
          arr[j + 1][1] = currentb;
      }
      return arr;
    }
    /*
    sortingAsc([[5,"b"],[13,"e"],["4","a"],[7,"c"],[8,"d"]]);
    4,a,5,b,7,c,8,d,13,e
    arr | arr[0]
    */
    //---------------------------------------------------------
    sqlFormatArr = (...args) => {  //input ["asd","sad"] bukan func("asd","sad")
      let arrData = ``;
      if (Array.isArray(args[0])) {  //input args[0] =  [["asd","sad"],["asd","sad"]]
        for (let i = 0; i < args[0].length; i++) {
            arrData = arrData+`"`+args[0][i][1]+`"`;
            if (i != args[0].length-1) {
              arrData = arrData+`,`;
            }
        }
      } else {  //untuk all = func("asd","sad")
        for (let i = 0; i < args.length; i++) {
          if (typeof args[i] === "string"){
            arrData = arrData+`"`+String(args[i])+`"`;
            if (i != args.length-1) {
              arrData = arrData+`,`;
            }
          } else if (typeof args[i] === "number"){
            arrData = arrData+`"`+Number(args[i])+`"`;
            if (i != args.length-1) {
              arrData = arrData+`,`;
            }
          }else if (typeof args[i] === "boolean"){
            arrData = arrData+`"`+Boolean(args[i])+`"`;
            if (i != args.length-1) {
              arrData = arrData+`,`;
            }
          } else {}
        }
        
      }
      let arrDataAkhir = `JSON_ARRAY(`+arrData+`)`;
      return arrDataAkhir; //sqlFormatArr("qwe",1,true)
    }
    /*
    let short = sortingAsc([[5,"b"],[13,"e"],[4,"a"],[7,"c"],["1","d"]]);
    let arr1 = sqlFormatArr(short); // array 2d -> array 1d
    let arr2 = sqlFormatArr("qwe",1,true); // -> array 1d
    */
    //---------------------------------------------------------
    //setelah diurutkan -> ubah jadi array 2D String
    arr2DString = (arr) => {
      let arrDataA = ``;
      for (let oa = 0; oa < arr.length; oa++) {
      	arrDataA = arrDataA+"[";
        for (let ob = 0; ob < arr[oa].length; ob++) {
          arrDataA = arrDataA+`"`+arr[oa][ob]+`"`;
          if (ob != arr[oa].length-1) {arrDataA = arrDataA+`,`;}
        }
        arrDataA = arrDataA+"]";
        
        if (oa != arr.length-1) {arrDataA = arrDataA+`,`;}
      }
      arrDataA = "["+arrDataA+"]";
      return arrDataA;
    }
    //WORSSSS
    /*
    let short = sortingAsc([[5,"b"],[13,"e"],[7,"d"],[8,"q"]]);   ->  5,b,7,d,8,q,13,e
    let data = arr2DString(short);                                ->  [["5","b"],["7","d"],["8","q"],["13","e"]]   
    */
    //---------------------------------------------------------

    

    validateUsername = (str) => {  //containsSpecialChars and spacewhite
        const specialChars = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        return !specialChars.test(str); //jika ada -> true , ubah jadi -> false (jika ditemukan maka gagal)
    }

    validateEmail = (email) => {  //menemukan email dengan cara mencari smbol @ dan .
        const pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return pattern.test(email); //jika benar -> true
    }

    validateNumber = (nmbr) => {  //mendapatkan number saja
        const pattern = /^\d+\.?\d*$/;
        return pattern.test(nmbr); //jika benar -> true
    }

    selectNumber = (nmbr) => {  
        //const numberexcept = /[^0-9]/g //menemukan hanya angka 0-9
        const numberOnly = /[^\d]/g; //\d is numerical characters 0-9 //menemukan angka diantara karakter huruf lain
        return nmbr.replace(numberOnly, ""); // Fiilter number output: 19197239378
    }

}

module.exports = new utils();