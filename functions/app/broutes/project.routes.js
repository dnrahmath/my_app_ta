module.exports = app => {

  const mainCon = require("../ccontrollers/project.controller");  // menjalankan function didalam controller 
  const params = `project`;

  app.post(`/api/${params}`, mainCon.create);
  app.put(`/api/${params}/put`, mainCon.update);  

  app.get(`/api/${params}`, mainCon.findAll);
  app.get(`/api/${params}/src`, mainCon.findOne);
  app.delete(`/api/${params}/`, mainCon.deleteAll);
  app.delete(`/api/${params}/del`, mainCon.delete);

};

