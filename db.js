const Pool = require("pg").Pool;

//COnfiguration Setting for DB Access is here, please change configuration below if there is auth setting change from DB
const pool = new Pool({
    user : "openpg",
    password: "openpgpwd",
    database: "boardapps",
    host: "localhost",
    port: 5432
}
);

//Function for Open Connection to DBnod
pool.connect((err)=> {
        if(err) throw err;
        console.log("PG berhasil terkoneksi!");
})

module.exports = pool;