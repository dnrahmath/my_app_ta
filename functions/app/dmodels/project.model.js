//--------------------Membutuhkan database model  [5]

const sql = require('../aconfig/dbmodel/db');//mysql dijalankan dengan const sql
//--------------------Menjalankan Perintah SQL

//------------------------------------------------------------------------------------

class projectMod {          //Class Model Memanggil seluruh function pada Class Car
  constructor(projectCtrl) {
    this.nama_project = projectCtrl.nama_project;
    this.nama_arch = projectCtrl.nama_arch;
    this.id_user_director = projectCtrl.id_user_director;
    this.release_time = projectCtrl.release_time;
  }

  //nanti cek [newproject]
  create = (nameTable, newproject, result) => {  //diisi projectMod baru dari [const projectMod = projectMod]
    
    let QueryStrng = `INSERT INTO ${nameTable} SET id_project = ?,nama_project = ?, nama_arch = ?, id_user_director = ?, release_time = ?;`;
    let ArrVal = [0,newproject.nama_project,newproject.nama_arch,newproject.id_user_director, newproject.release_time] ;

    sql.query(QueryStrng, ArrVal, (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
  
      console.log(`created ${nameTable} : `, { id: res.insertId, ...newproject });
      result(null, { id: res.insertId, ...newproject });
    });
  };

  //-------------------------------------------------------------------------------------------------------------------------------------------------------------

  updateById = (nameTable, jsonQuery, projectMod, result) => {  //dibuat class baru - [ new projectMod(req.body) ]
    
    const cusparams = ["id","nmprjct","nmarch","iddrc","rtime"]; //kode yg dipakai di parameter
    const listColm = ["id_project","nama_project","nama_arch","id_user_director","release_time"]; //list table di database
    let target,targetSrc = "";

    const keys = Object.keys(jsonQuery);
    for (let i = 0; i < listColm.length; i++) {
      if (keys[0] == cusparams[i]) {
        target = listColm[i];
        targetSrc = jsonQuery[keys];
      }
    }


    let QueryStrng = `UPDATE ${nameTable} SET nama_project = ?, nama_arch = ?, id_user_director = ?, release_time = ? WHERE ${target} = ? ;`;
    let ArrVal = [projectMod.nama_project,projectMod.nama_arch,projectMod.id_user_director,projectMod.release_time, targetSrc] ;

    sql.query(QueryStrng, ArrVal, (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(null, err);
          return;
        }
  
        if (res.affectedRows == 0) {
          // not found projectMod with the jsonQuery
          result({ kind: "not_found" }, null);
          return;
        }
  
        console.log(`updated ${nameTable}: `, { ...projectMod });
        result(null, { ...projectMod });
      }
    );
  };

  //-------------------------------------------------------------------------------------------------------------------------------------------------------------

  getAll = (nameTable, result) => {
    
    let QueryStrng = `SELECT * FROM ${nameTable} ;`;
    
    sql.query(QueryStrng, (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }
  
      console.log(`${nameTable} : `, res);
      result(null, res);
    });
  };

  //-------------------------------------------------------------------------------------------------------------------------------------------------------------

  findById = (nameTable, jsonQuery, result) => { //nanti dibuat byId bisa lebih
    
    const cusparams = ["id","nmprjct","nmarch","iddrc","rtime"]; //kode yg dipakai di parameter
    const listColm = ["id_project","nama_project","nama_arch","id_user_director","release_time"]; //list table di database
    let target,targetSrc = "";

    const keys = Object.keys(jsonQuery);
    for (let i = 0; i < listColm.length; i++) {
      if (keys[0] == cusparams[i]) {
        target = listColm[i];
        targetSrc = jsonQuery[keys];
      }
    }

    let QueryStrng = `SELECT * FROM ${nameTable} WHERE ${target} = '${targetSrc}' ;`;

    sql.query(QueryStrng, (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
  
      if (res.length) {
        console.log(`found ${nameTable} : `, res[0]);
        result(null, res[0]);
        return;
      }
  
      // not found projectMod with the jsonQuery
      result({ kind: "not_found" }, null);
    });
  };

  //-------------------------------------------------------------------------------------------------------------------------------------------------------------

  //async removeAll(nameTable, result){
  removeAll = (nameTable, result) => {

    //masih gagal-walaupun di double stringnya
    let QueryStrng = `DELETE FROM ${nameTable};`;
    //let QueryStrng = `truncate ${nameTable};`;
    
    //await sql.query(QueryStrng, (err, res) => {
    sql.query(QueryStrng, (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }
  
      if (res.affectedRows == 0) {
        // not found nameTable with the jsonQuery
        result({ kind: "not_found" }, null);
        return;
      }
  
      console.log(`deleted ${nameTable}`);
      result(null, res);
    });
  
  };

  //-------------------------------------------------------------------------------------------------------------------------------------------------------------

  remove = (nameTable, jsonQuery, result) => {

    const cusparams = ["id","nmprjct","nmarch","iddrc","rtime"]; //kode yg dipakai di parameter
    const listColm = ["id_project","nama_project","nama_arch","id_user_director","release_time"]; //list table di database
    let target,targetSrc = "";

    const keys = Object.keys(jsonQuery);
    for (let i = 0; i < listColm.length; i++) {
      if (keys[0] == cusparams[i]) {
        target = listColm[i];
        targetSrc = jsonQuery[keys];
      }
    }

    let QueryStrng = `DELETE FROM ${nameTable} WHERE ${target} =  ${targetSrc};`;

    sql.query(QueryStrng, (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(null, err);
        return;
      }
  
      if (res.affectedRows == 0) {
        // not found nameTable with the jsonQuery
        result({ kind: "not_found" }, null);
        return;
      }
  
      console.log(`deleted ${nameTable} with id: ${jsonQuery}`, jsonQuery);
      result(null, res);
    });
  };

}

//------------------------------------------------------------------------------------

module.exports = projectMod;
