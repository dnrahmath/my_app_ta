//--------------------Memanggil Model  [4]  
const projectMod = require("../dmodels/project.model");  // menjalankan function buatan didalam model
const nameTable = `tblc_project`;
//--------------------"Message dari hasil pemangilan dari model"


exports.create = (req, res) => {

  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: `Content can not be empty!`
    });
  }

  // Create a projectCtrl
  const projectCtrl = new projectMod({
    nama_project: req.body.namaproject,
    nama_arch: req.body.namaarch,
    id_user_director: req.body.iduserdirector,
    release_time: new Date().getTime()//toISOString()
  });

  // Save projectCtrl in the database
  projectCtrl.create(nameTable, projectCtrl, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || `Some error occurred while creating the ${nameTable}.`
      });
    else res.send(data);
  });
};

//------------------------------------------------------------------------------------

// Update a projectCtrl identified by the ID in the request
exports.update = (req, res) => {

  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // Create a projectCtrl
  const projectCtrl = new projectMod({
    nama_project: req.body.namaproject,
    nama_arch: req.body.namaarch,
    id_user_director: req.body.iduserdirector,
    release_time: new Date().getTime()//toISOString()
  });

  projectCtrl.updateById(nameTable, req.query, projectCtrl, (err, data) => {
      if (err) {
        if (err.kind === "not_found") {
          res.status(404).send({
            message: `Not found ${nameTable} with ${req.query}.`
          });
        } else {
          res.status(500).send({
            message: `Error updating ${nameTable} with ${req.query}.`
          });
        }
      } else res.send(data);
    }
  );
};

//------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------

// Retrieve all projects from the database.
exports.findAll = (req, res) => {

  const projectCtrl = new projectMod({});

  projectCtrl.getAll(nameTable, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || `Some error occurred while retrieving ${nameTable}.`
      });
    else res.send(data);
  });
};

//------------------------------------------------------------------------------------

// Find a single projectCtrl with a ID
exports.findOne = (req, res) => {

  const projectCtrl = new projectMod({});

  projectCtrl.findById(nameTable, req.query, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found ${nameTable} with ${req.query}.`
        });
      } else {
        res.status(500).send({
          message: `Error retrieving ${nameTable} with ${req.query}.`
        });
      }
    } else res.send(data);
  });
};

//------------------------------------------------------------------------------------

// Delete all projects from the database.
exports.deleteAll = (req, res) => {

  // Create a projectCtrl
  const projectCtrl = new projectMod({});

  projectCtrl.removeAll(nameTable, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found ${nameTable}.`
        });
      } else {
        res.status(500).send({
          message: `Could not delete ${nameTable}.`
        });
      }
    } else res.send({ message: `table = ${nameTable}, all was deleted successfully!` });
  });
};

//------------------------------------------------------------------------------------

// Delete a projectCtrl with the specified ID in the request
exports.delete = (req, res) => {

  const projectCtrl = new projectMod({});

  projectCtrl.remove(nameTable, req.query, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found ${nameTable} with ${req.query}.`
        });
      } else {
        res.status(500).send({
          message: `Could not delete ${nameTable} with ${req.query}.`
        });
      }
    } else res.send({ message: `table = ${nameTable}, ${req.query} was deleted successfully!` });
  });
};

//------------------------------------------------------------------------------------
