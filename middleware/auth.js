var connection = require('../db');
var md5 = require('md5');
var response = require('../res');
var jwt = require('jsonwebtoken');
var config = require('../config/secret');
var ip = require('ip');

var rand, mailOptions, host, link

exports.verifikasi = function (req, res) {
     console.log(req.protocol)
     //console.log("req.id : " + req.query.id + "| rand : "+rand);
     if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
          connection.query('UPDATE credential SET isVerified=$1 WHERE email=$2', [1, req.query.email],
               function (error, rows, fields) {
                    if (error) {
                         console.log(error)
                         res.end(error)
                    } else {
                         res.end("<h1>Email anda " + mailOptions.to + "telah terverifikasi")
                    }
               }
          )
          
     }
}

exports.ubahPassword = function (req, res) {

     //buat input req body
     var data = {
          email: req.body.email,
          currpassword: md5(req.body.currpassword),
          newpassword: md5(req.body.newpassword)
     }

     //jalankan kueri
     /*var query = "SELECT email,password FROM ?? WHERE ??=?";
     var table = ["user", "email", data.email];

     query = mysql.format(query, table);*/

     connection.query("SELECT email,password FROM credential WHERE username=$1",[data.email],
      function (error, rows) {
          if (error) {
               console.log(error);
          } else {
               if (rows.length == 1) {
                    email = rows[0].email;
                    password = rows[0].password;

                    if (data.currpassword == password) {
                         if (data.newpassword == data.currpassword) {
                              res.json({
                                   success: false,
                                   message: "Password masih sama dengan sebelumnya!"
                              }).end()
                         } else {
                              connection.query('UPDATE credential SET password=$1 WHERE email=$2',
                                   [data.newpassword, email],
                                   function (error, rows, fields) {
                                        if (error) {
                                             res.json({
                                                  success: false,
                                                  message: error
                                             }).end()
                                        } else {
                                             res.json({
                                                  success: true,
                                                  message: "Berhasil Update Password!"
                                             }).end()
                                        }
                                   }
                              )
                         }
                    }
                    else {
                         res.json({
                              success: false,
                              message: "Gagal Update Password!"
                         }).end()
                    }
               }
               else {
                    res.json({
                         success: false,
                         message: "Password Salah!"
                    }).end()
               }
          }
     });
}

// controller untuk login
exports.login = async (req, res) => {
     var post = {
          password: req.body.password,
          username: req.body.username
     }

     try {
          const respCredential = await connection.query("SELECT * FROM credential WHERE username=$1 AND password=$2 and active_from <= current_date and active_to >= current_date and active = true", [post.username, md5(post.password)])
          if (respCredential.rowCount == 1) {
               var token = jwt.sign({ id : respCredential.rows[0].id }, config.secret, {
                    //ubah expires dalam ms
                    expiresIn: '2629800000'
               });
               //console.log(respCredential.rows[0].id);
               id_user = respCredential.rows[0].id;
               //1 tambahan row username
               username = respCredential.rows[0].username;
               //2 tambahan row role
               //role = rows[0].role;

               //3 variable expires
               // var expired = 30000
               var expired = 2629800000
               var isVerified = respCredential.rows[0].isVerified
               console.log(token);

               var data = {
                    id_user: id_user,
                    access_token: token,
                    ip_address: ip.address()
               }

               /*var query = "INSERT INTO ?? SET ?";
               var table = ["akses_token"];

               query = mysql.format(query, table);*/
               connection.query("INSERT INTO access_token(id_credential, access_token, ip_address) VALUES ($1, $2, $3) returning *", [data.id_user, data.access_token, data.ip_address], function (error, rows) {
                    if (error) {
                         console.log(error);
                    } else {
                         res.json({
                              success: true,
                              message: 'Token JWT tergenerate!',
                              token: token,
                              //4 tambahkan expired time
                              expires: expired,
                              currUser: data.id_user,
                              user: username,
                              //3 tambahkan role
                              //role: role,
                              isVerified: isVerified
                         });
                    }
               });
          }
          else {
               res.json({ "Error": true, "Message": "username atau password salah!" });
          }
     } catch (error) {
          console.log(error);
     }
}

exports.halamanrahasia = function (req, res) {
     response.ok("Halaman ini hanya untuk user dengan role = 2!", res);
}

//menampilkan semua data config
exports.adminconfig = function (req, res) {
     connection.query('SELECT * FROM config', function (error, rows, fields) {
          if (error) {
               console.log(error);
          } else {
               response.ok(rows, res)
          }
     });
};