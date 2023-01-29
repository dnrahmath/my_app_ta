




module.exports = {
  TOKEN_HASH_NUMB : 10,
  TOKEN_ENCRYPTION:"MySecretKey",
  ACCESS_LOGIN : {
    TOKEN_SECRET : "access-login-the-super-strong-secret",
    TOKEN_EXP : "3000s", //5 minutes 5x60s
    TOKEN_MAXAGE : 5 * 60 * 1000, //300000
    TOKEN_STRING_DATE : () => {
      //const maxage = this.ACCESS_LOGIN.TOKEN_MAXAGE;
      const maxage = 300000; 
      const date = new Date(new Date().getTime()+maxage).toString();
      return date}
  },
  ACCESS : {
    TOKEN_SECRET : "access-the-super-strong-secret",
    TOKEN_EXP : "18000s", //30 minutes 30x60s
    TOKEN_MAXAGE : 30 * 60 * 1000,
    TOKEN_STRING_DATE : () => {
      const maxage = 1800000; 
      const date = new Date(new Date().getTime()+maxage).toString();
      return date}
  },
  REFRESH : {
    TOKEN_SECRET : "refresh-the-super-strong-secret",
    TOKEN_EXP : "2d", //2 hari
    TOKEN_EXP_COOKIE_MAXAGE : 2 * 24 * 60 * 60 * 1000, //2 hari - 172800000
    TOKEN_STRING_DATE : () => {
      const maxage = 172800000; 
      const date = new Date(new Date().getTime()+maxage).toString();
      return date}
  },
  settings: {
    oLa: ["Read", "Delete"], //oneLane
    tLa: ["Create", "Update"], //twoLane
    ctrlF: "find text",
    ctrlD: "select same text",
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  tL: { //tableList
    customers: ["id", "email", "name", "active"],
    users: ["id", "email", "name", "password"]
  },
  secret: 'supersecret'

};