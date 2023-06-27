'use strict';

var response = require('./res');
var connection = require('./db');
const fetch = require('node-fetch');
const https = require('https');
var jwt = require('jsonwebtoken');
var config = require('./config/secret');
var ip = require('ip');
const moment = require('moment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CronJob = require('cron').CronJob;
const mime = require('mime');
const util = require('util');
const query = util.promisify(connection.query).bind(connection);
const cron = require('node-cron');

const axios = require('axios');
const { DefaultDeserializer } = require('v8');

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only videos are allowed.'));
  }
};

const upload = multer({ storage, fileFilter });

exports.index = function (req, res) {
    return response.ok("Haloo,Aplikasi REST API ku berjalan!", res)
};
//Show data config based on id
exports.tampilberdasarkanid = function (req, res) {
  let id = req.params.id;
  connection.query(
    'SELECT * FROM config WHERE id = ?',
    [id],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      } else {
        return res.json(rows);
      }
    }
  );
};
//Show data for All Data configuration
exports.showconfig = async (req, res) => {
  try {
    const allconfig = await connection.query('SELECT * FROM public.config');
    return res.json(allconfig.rows);
    
  } catch (err) {
    console.error(err.message);
    return res.sendStatus(500);
  }
};
//CRUD Config
exports.crudConfig = async (req, res) => {
  const crudType = req.headers.crudtype;

  try {
    const {
      condition,
      description,
      valuenum,
      valuetext,
      company_id,
      active,
      id: idconfig
    } = req.body;

    let text, value;

    if (crudType === "insert") {
      text =
        'INSERT INTO config(condition, description, valuenum, valuetext, company_id, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
      value = [condition, description, valuenum, valuetext, company_id, active];
    } else if (crudType === "update") {
      text =
        'UPDATE config SET condition = $1, description = $2, valuenum = $3, valuetext = $4, company_id = $5, active = $6 WHERE id = $7 RETURNING *';
      value = [condition, description, valuenum, valuetext, company_id, active, idconfig];
    } else if (crudType === "delete") {
      text = 'DELETE FROM config WHERE id = $1';
      value = [idconfig];
    } else {
      return res.status(400).json({ Message: "Not known CRUD Type!" });
    }

    if (text !== "EXIT") {
      const resCrud = await connection.query(text, value);
      return res.status(200).json({ Message: "Operation successful!" });
    } else {
      return res.status(400).json({ Message: "Not known CRUD Type!" });
    }
  } catch (err) {
    console.error(err.message);
    return res.sendStatus(500);
  }
};

exports.getUserLogin = async (req, res) => {
   
        try {
    

            var EmployeeNo = req.body.EmployeeNo;
            var Password = req.body.Password;
        
            //LOGIN DMS
            let bodyLoginDMS = {
                "EmployeeNo":EmployeeNo,
                "Password":Password
            };
            console.log(bodyLoginDMS);
            
            var HeaderLoginDMS = {
                'Id': 'unotek',
                'Pwd': 'unotek:unotekpassword123',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ProcFlag': 'GetValidUserDataForApps'
            };
            console.log(HeaderLoginDMS);
            // https://api.hinodms.co.id/Request.ashx
            // http://apitest.hinodms.co.id/Request.ashx
            const resp = await fetch('https://api.hinodms.co.id/Request.ashx', {
                method: 'POST',
                body: JSON.stringify(bodyLoginDMS),
                headers: HeaderLoginDMS
            });
    
            const jsonLogin = await resp.json();
            // console.log(jsonLogin);
            // console.log(bodyLoginDMS);
            //response.failed("Login Error", res);
            
            if(jsonLogin.GetValidUserDataForAppsResult[0].ResultStatus[0].Message =="Login Success"){
                var token = jwt.sign({ id : EmployeeNo }, config.secret, {
                    //ubah expires dalam ms
                    expiresIn: '2629800000'
               });
               //console.log(respCredential.rows[0].id);
               var id_user = 10;
               //1 tambahan row username
               var username = EmployeeNo;
               //2 tambahan row role
               //role = rows[0].role;

               //3 variable expires
               // var expired = 30000
               var expired = 2629800000
               //var isVerified = respCredential.rows[0].isVerified
               console.log(token);

               var data = {
                    id_user: id_user,
                    access_token: token,
                    ip_address: ip.address()
               }

               /*var query = "INSERT INTO ?? SET ?";
               var table = ["akses_token"];

               query = mysql.format(query, table);*/
               await connection.query("INSERT INTO access_token(id_credential, access_token, ip_address) VALUES ($1, $2, $3) returning *", [data.id_user, data.access_token, data.ip_address], function (error, rows) {
                    if (error) {
                        console.log(error);
                        //response.failed(err)
                    } else {
                        console.log("Token JWT tergenerate!");
                        //GET USER PROFILE
                        
                         /*res.json({
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
                         });*/
                    }
               });

               let bodyUserHMSI = {
                //"ChangeDateTimeFrom" : "2020-06-10 00:00:00.000",
                //"ChangeDateTimeTo" :  "2020-06-15 00:00:00.000",
                "EmployeeNo": EmployeeNo
            };
            
            var HeaderUserHMSI = {
                'Id': 'unotek',
                'Pwd': 'unotek:unotekpassword123',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'ProcFlag': 'GetUserProfile'
            };
    
            const resp = await fetch('https://api.hinodms.co.id/Request.ashx', {
                method: 'POST',
                body: JSON.stringify(bodyUserHMSI),
                headers: HeaderUserHMSI
            });
    
            const jsonUser = await resp.json();
            
            console.log(jsonUser.GetUserProfileResult[0].CompanyCode == "3155098");

            if (jsonUser.GetUserProfileResult[0].CompanyCode == "3155098") {
                try {
                    const allCompany = await connection.query('SELECT CompanyCode, CompanyName FROM company where active = true order by companyname');
                    //res.json(allCompany.rows);
                    return response.okLogin(allCompany.rows,data.access_token, res);
                } catch (err) {
                    return
                    console.error(err.message);
                }
            } else {
                var NewjsonUser = {};
            
                NewjsonUser["CompanyCode"] =jsonUser.GetUserProfileResult[0].CompanyCode;
                NewjsonUser["CompanyName"] =jsonUser.GetUserProfileResult[0].CompanyName;
    
            // NewjsonUser.map(({CompanyCode, CompanyName}) => ({CompanyCode, CompanyName}));
    
                //console.log(NewjsonUser);
                
                return response.okLogin(NewjsonUser,data.access_token, res);
            }
                
            }else{
                var NewFailedUser = {};
                
                NewFailedUser["CompanyCode"] =null;
                NewFailedUser["CompanyName"] =null;
                return response.failed(NewFailedUser, res);
            }
            
            
        
        } catch (err) {
            console.error('error'+err.message);
        }
};

exports.BookingAllocation = function (req, res) {
  try {
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });

    const postData = req.body;
    const currentDate = moment().format('YYYY-MM-DD');
    const nextWeekDate = moment(currentDate).add(6, 'days').format('YYYY-MM-DD');

    const article = {
      "CompanyCode": postData.CompanyCode,
      "VehicleChassisNo": "",
      "BookingDocNo": "",
      "BookingStatus": "",
      "BookingServDate": "",
      "BookingServTime": "",
      "BookingServDateFrom": currentDate,
      "BookingServDateTo": nextWeekDate,
      "CpContactViaCode": "",
      "DealerRepCode": postData.DealerRepCode,
      "ServiceSite": "",
      "CreationDatetime": "",
      "ChangeDatetime": "",
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    const headers = { 
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "*", 
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', 
      "Content-Type": "application/json",
      'ID': 'hmsi',
      'Pwd': 'hmsi:hmsipassword123',
      'ProcFlag': 'GetBookingInfoRegister'
    };

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/bookinginfo/list', article, { headers, httpsAgent: agent, timeout: 10000})
      .then(response => {
        const NewBook = response.data.GetBookingInfoResult;

        NewBook.forEach(element => {
          const BookingServDate = element.BookingServDate;
          const formattedDate = moment(BookingServDate).format("YYYY-MM-DD");
          const BookingServTime = element.BookingServTime;
          const combinedDateTimeString = formattedDate + ' ' + BookingServTime;
          const formattedDateTime = moment(combinedDateTimeString, "YYYY-MM-DD HH:mm:ss").format("M/D/YYYY h:mm:ss A");
          const ServicePlanDate = formattedDateTime; 
          element.ServicePlanDate = ServicePlanDate;
          delete element._httpMessage;
        });

        res.json(NewBook);
      })
      .catch(error => {
        if (error.code === 'ECONNABORTED') {
          console.error('Permintaan melewati batas waktu (timeout)');
          res.status(500).send('Permintaan melewati batas waktu (timeout)');
        } else {
          console.error(error);
          res.status(500).send('Terjadi kesalahan dalam permintaan');
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam permintaan');
  }
};

exports.workInfo = function (req, res) {
  try {
    const postData = req.body;

    const currentDate = moment().format('YYYY-MM-DD');

    const article = {
      "CompanyCode": postData.CompanyCode,
      "WoSysNo": "",
      "WoDocNo": "",
      "LastUpdate": "",
      "StartDate": currentDate,
      "EndDate": currentDate,
      "DealerRepCode": postData.DealerRepCode,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    const headers = {
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "*", 
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', 
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetWorkInfoRegister"
    };

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/workinfo/list', article, {
      headers,
      httpsAgent: agent,
      timeout: 10000
    })
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        if (error.code === 'ECONNABORTED') {
          console.error('Permintaan melewati batas waktu (timeout)');
          res.status(500).send('Permintaan melewati batas waktu (timeout)');
        } else {
          console.error(error);
          res.status(500).send('Terjadi kesalahan dalam permintaan');
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan dalam permintaan');
  }
};

exports.masterrepcode = function (req, res) {
  try {
    const postData = req.body;

    const dataarticle = {
      "CompanyCode": postData.CompanyCode,
      "StartDate": "",
      "EndDate": "",
      "LastUpdateDate": postData.LastUpdateDate,
      "Status": "",
      "DealerRepCode": "",
      "ProfitCenterCode": postData.ProfitCenterCode,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    const headers = {
      "Access-Control-Allow-Origin": "*", 
      "Access-Control-Allow-Headers": "*", 
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', 
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetDealerRepCodeRegister"
    };

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/masterrepcode/list', dataarticle, {
      headers,
      httpsAgent: agent,
      timeout: 10000
    })
      .then(response => {
        const processedDealerRepDesc = new Set();
        const DataRepcode = [];

        if (response.data.GetDealerRepCodeRegisterResult) {
          const datares = response.data.GetDealerRepCodeRegisterResult;

          if (Array.isArray(datares)) {
            datares.forEach((drow) => {
              if (!processedDealerRepDesc.has(drow.DealerRepDesc)) {
                processedDealerRepDesc.add(drow.DealerRepDesc);
                DataRepcode.push({
                  "CompanyCode": drow.CompanyCode,
                  "CompanyName": drow.CompanyName,
                  "ProfitCenterCode": drow.ProfitCenterCode,
                  "ProfitCenterDesc": drow.ProfitCenterDesc,
                  "DealerRepCode": drow.DealerRepCode,
                  "DealerRepDesc": drow.DealerRepDesc,
                  "CreationUserId": drow.CreationUserId,
                  "CreationDatetime": drow.CreationDatetime,
                  "ChangeUserId": drow.ChangeUserId,
                  "ChangeDatetime": drow.ChangeDatetime,
                  "Status": drow.Status
                });
              }
            });
          }
        }

        const AllDataRepcode = {
          "GetDealerRepCodeRegisterResult": DataRepcode
        };

        return res.json(AllDataRepcode);
      })
      .catch(error => {
        if (error instanceof axios.TimeoutError) {
          // Penanganan kesalahan timeout di sini
          console.error('Permintaan melewati batas waktu (timeout)');
          return res.status(500).send('Permintaan melewati batas waktu (timeout)');
        } else {
          // Penanganan kesalahan lainnya di sini
          console.error(error);
          return res.status(500).send('Terjadi kesalahan dalam permintaan');
        }
      });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Terjadi kesalahan dalam permintaan');
  }
};

exports.holiday = async (req, res) => {
  try {
    const crudType = req.headers.crudtype;
    const { CompanyCode, Description, Holidays_date, Active } = req.body;

    let text = '';
    let text1 = '';
    let text2 = '';
    let text3 = '';

    let values = [];
    let values1 = [];
    let values2 = [];
    let values3 = [];
    const allCompany = [];

    try {
    const result = await query('SELECT companycode FROM public.company ORDER BY id ASC');
    result.rows.forEach(row => {
        const companyCode = row.companycode;
        allCompany.push(companyCode);
    });
    } catch (error) {
    console.error('Error querying database:', error);
    }

    if (crudType === "insert") {
        text = `INSERT INTO holidays(companycode, description, holidays_date, active) 
        VALUES ($1, $2, $3, $4) ON CONFLICT ON CONSTRAINT holidays_companycode_date_unique DO UPDATE SET description = $2, active = $4 
        RETURNING *`;
      values = [CompanyCode, Description, Holidays_date, Active];

    } else if (crudType === "update") {
      text = 'UPDATE holidays SET description = $2, active = $4 WHERE holidays_date = $3 AND companycode = $1';
      values = [CompanyCode, Description, Holidays_date, Active];

    } else if (crudType === "delete") {
      text = 'DELETE FROM holidays WHERE holidays_date = $1 AND companycode = $2';
      values = [Holidays_date, CompanyCode];

    } else {
      return res.status(400).json({ Message: "Not known CRUD Type!" });
    }

    try {
      if(CompanyCode === "Allcompany"){ 

        allCompany.push("Allcompany");

        if(crudType === "insert"){

          allCompany.forEach(async CompanyCodeAll => {
          values1 = [CompanyCodeAll, Description, Holidays_date, Active];
          const resCrud = await connection.query(text, values1);
          });
          return res.json({ Message: "Operation successful!" });

        } else if (crudType === "update") {

          allCompany.forEach(async CompanyCodeAll => {
          values2 = [CompanyCodeAll, Description, Holidays_date, Active];
          const resCrud = await connection.query(text, values2);
          });
          return res.json({ Message: "Operation successful!" });

        } else if (crudType === "delete") {

          allCompany.forEach(async CompanyCodeAll => {
          values3 = [Holidays_date, CompanyCodeAll];
          const resCrud = await connection.query(text, values3);
          });
          return res.json({ Message: "Operation successful!" });

        } else {

          return res.status(400).json({ Message: "Not known CRUD Type!" });

        }

      }else{

        const resCrud = await connection.query(text, values);
        return res.json({ Message: "Operation successful!" });

      }

    } catch (err) {
      console.error(err.stack);
      return res.status(500).json({ Message: err.message });
    }

  } catch (err) {
    console.error(err.message);
  }
};

exports.holidaycompanycode = async (req, res) => {
  try {
    const { companycode } = req.params; // Mengakses companycode dari parameter rute

    // Mengambil informasi hari libur dari database dengan timeout
    const queryText = 'SELECT * FROM public.holidays WHERE companycode = $1 ORDER BY holidays_date ASC';
    const queryValues = [companycode];
    const queryConfig = {
      text: queryText,
      values: queryValues,
      timeout: 10000 // Timeout dalam milidetik (misalnya 5 detik)
    };
    const results = await connection.query(queryConfig);
    return res.json(results.rows);
  } catch (error) {
    console.error(error);

    if (error.name === 'TimeoutError') {
      return res.status(504).json({ message: 'Request timeout' });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.video = async (req, res) => {

  if (!req.body || !req.file) {
    res.status(400).json({ message: 'Check file Name and Video,belum sesuai' });
    return;
  }

  const { originalname } = req.file;
  const { companycode } = req.body;
  const { description } = req.body;
  // const { active } = req.body;

  const fileType = mime.getType(originalname);
  const fileExtension = mime.getExtension(req.file.mimetype);
  // console.log(fileType.startsWith('video'))
  if (!fileType || !fileType.startsWith('video')) {
    res.status(400).json({ message: 'Invalid file type. Only videos are allowed.' });
    return;
  }
  // Generate unique filename with timestamp and original name
  const timestamp = Date.now();
  const filename = `${timestamp}.${fileExtension}`;
  console.log(filename);

  // Construct the file path
  const filePath = path.join('uploads', filename);
  // Simpan informasi video ke database
  connection.query('INSERT INTO videos (companycode,description,path) VALUES ($1, $2, $3)', [companycode,description,filePath], (error, results) => {
    if (error) {
      console.error(error);
      return es.status(500).json({ message: 'Internal server error' });
    } else {
      // Move the uploaded file to the desired locationnp
      fs.renameSync(req.file.path, filePath);
      return res.json({ message: 'Video uploaded successfully' });
    }
  });

};

exports.get_video = async (req, res) => {
  try {
    const { companycode } = req.params;
    const all = "Allcompany";

    console.log(all);
    // Retrieve videos from the database based on companycode
    const results = await connection.query('SELECT * FROM videos WHERE companycode = $1 OR companycode = $2', [companycode, all]);

    if (results.rows.length === 0) {
      return res.status(200).json({ message: 'No videos found for the specified companycode' });
    }

    const videos = results.rows;
    return res.json(videos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.videodelete = async (req, res) => {
  try {
    const videoId = req.params.id;

    // Mengambil informasi path file video dari database
    const results = await connection.query('SELECT path FROM videos WHERE id = $1', [videoId]);

    if (results.rows.length === 0) {
      return res.status(200).json({ message: 'Video not found' });
    }

    const videoPath = results.rows[0].path;

    // Menghapus data video dari database
    await connection.query('DELETE FROM videos WHERE id = $1', [videoId]);

    // Menghapus file video dari folder "uploads"
    await fs.promises.unlink(videoPath);

    return res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.scheduller_sparepart = async (req, res) => {

    const allCompany = [];

    try {
    const result = await query('SELECT companycode FROM public.company ORDER BY id ASC');
    result.rows.forEach(row => {
        const companyCode = row.companycode;
        allCompany.push(companyCode);
    });
    } catch (error) {
    console.error('Error querying database:', error);
    }

    const companyCodes = allCompany;
    const today = new Date();
    const date = String(today.getDate()).padStart(2, '0');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentDay = date

  // Lakukan tugas cron untuk setiap parameter
  companyCodes.forEach(async companycode1 => {
    // datatukday.forEach(async day => {

    var companycode = companycode1;
    var inputbulan = currentMonth;
    var inputtahun = currentYear;
    var inputday = currentDay;
    var formattedDay = parseInt(inputday, 10);
    var new_tanggal = `${inputtahun}-${inputbulan}-${inputday}`
  
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    
    try {
  
        const headers = { 
                        "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
                        "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
                        "Content-Type": "application/json",
                        "ID": "hmsi",
                        "Pwd": "hmsi:hmsipassword123",
                        "ProcFlag": "GetSparepartControlBoardDetail"
                        };
        
        const databody ={
                        "CompanyCode":companycode,
                        "DatePeriod":new_tanggal,
                        "UserInfo":[
                            {
                            "LoginID":"DCBAPI001",
                            "Password":"password.123"
                            }
                        ]
                        };
    
        const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list', databody, {
        headers,
        httpsAgent: agent
        });
    
        var respondetail = response.data.GetSparepartControlBoardDetailResult;
        var new_tanggal = response.config.data; // Access DatePeriod
        var jsonString = new_tanggal;
        var jsonObject = JSON.parse(jsonString);
        var datePeriode = jsonObject.DatePeriod;
        var companyname = 0;
        var total = 0;
        var total1 = 0;
        
        if(respondetail){
            respondetail.forEach((drow) => {
                companycode = drow.CompanyCode;
                companyname = drow.CompanyName;
                datePeriode = drow.DatePeriode;
                total1 += parseFloat(drow.TotalAmount);
                total = parseFloat(total1/1000000);
                // total = Math.round(total);
                total = parseInt(total);
            });
        }

        connection.query('INSERT INTO daily (tanggal, companycode, companyname, dateperiode, amount, updated_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT ON CONSTRAINT daily_companycode_dateperiode_key DO UPDATE SET amount = $5, updated_at = NOW()',
            [formattedDay, companycode, companyname , datePeriode, total],
            (error) => {
            if (error) {
                console.log(error)
            }
            console.log(`Data has been inserted or updated ${companycode} tanggal ke ${formattedDay}`);
            }
        );

    } catch (error) {
     console.log(error);
    }
  
});
return res.json(`"Update Data Daily Sparepart Tanggal ${currentDay}"`)
};

exports.scheduller_sparepart_manual = async (req, res) => {

  var postData = JSON.parse(JSON.stringify(req.body));
  var PeriodDay = postData.PeriodDay;

  if(PeriodDay === 0 || (typeof PeriodDay === 'string' && PeriodDay === '0')) {
  return res.status(400).json({ error: 'Invalid PeriodDay' });
  }

  if (Number(PeriodDay) >= 1 && Number(PeriodDay) <= 9) {
    PeriodDay = PeriodDay.toString().padStart(2, '0');
  }

  const allCompany = [];

  try {
  const result = await query('SELECT companycode FROM public.company ORDER BY id ASC');
  result.rows.forEach(row => {
      const companyCode = row.companycode;
      allCompany.push(companyCode);
  });
  } catch (error) {
  console.error('Error querying database:', error);
  }

  const currentDate = new Date();
  const companyCodes = allCompany;
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentDay = PeriodDay;

companyCodes.forEach(async companycode1 => {

  var companycode = companycode1;
  var inputbulan = currentMonth;
  var inputtahun = currentYear;
  var inputday = currentDay;
  var new_tanggal = `${inputtahun}-${inputbulan} -${inputday}`

  const agent = new https.Agent({
    rejectUnauthorized: false
  });
  
  try {

      const headers = { 
                      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
                      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
                      "Content-Type": "application/json",
                      "ID": "hmsi",
                      "Pwd": "hmsi:hmsipassword123",
                      "ProcFlag": "GetSparepartControlBoardDetail"
                      };
      
      const databody ={
                      "CompanyCode":companycode,
                      "DatePeriod":new_tanggal,
                      "UserInfo":[
                          {
                          "LoginID":"DCBAPI001",
                          "Password":"password.123"
                          }
                      ]
                      };
  
      const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list', databody, {
      headers,
      httpsAgent: agent
      });
  
      var respondetail = response.data.GetSparepartControlBoardDetailResult;
      var new_tanggal = response.config.data; // Access DatePeriod
      var jsonString = new_tanggal;
      var jsonObject = JSON.parse(jsonString);
      var datePeriode = jsonObject.DatePeriod;
      var companyname = 0;
      var total = 0;
      var total1 = 0;
      
      if(respondetail){
          respondetail.forEach((drow) => {
              companycode = drow.CompanyCode;
              companyname = drow.CompanyName;
              datePeriode = drow.DatePeriode;
              total1 += parseFloat(drow.TotalAmount);
              total = parseFloat(total1/1000000);
              total = parseInt(total);
          });
      }

      connection.query('INSERT INTO daily (tanggal, companycode, companyname, dateperiode, amount, updated_at) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT ON CONSTRAINT daily_companycode_dateperiode_key DO UPDATE SET amount = $5, updated_at = NOW()',
          [inputday, companycode, companyname , datePeriode, total],
          (error) => {
          if (error) {
              console.log(error)
          }
          console.log(`Data has been inserted or updated ${companycode} tanggal ke ${inputday}`);
          }
      );

  } catch (error) {
   console.log(error);
  }

});
return res.json(`"Update Data Daily Sparepart Tanggal ${currentDay}"`)
};

exports.spektrumku = async (req, res) => {

  var postData = JSON.parse(JSON.stringify(req.body));

  var companycode =postData.CompanyCode;
  var inputbulan = postData.PeriodMonth;
  var inputtahun = postData.PeriodYear;
  var bulan = postData.PeriodMonth;
  var tahun = postData.PeriodYear;

  var fordate = `${inputtahun}-${inputbulan}`;
  var databaru = [];
  var TargetYearly;
  var sumMonthly = [];
  var sumYearly= [];
  var AmountTargetMon = 0;
  let diff;
  var MovingCode;
  var TypeTran;
  var movingCode = null;

  var resJ=[];
  const agent = new https.Agent({  
   rejectUnauthorized: false
 });


const requests = [
  {
    url: 'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardmovingcode/list',

    headers: {
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardMovingCode"
    },

    body: {
    "CompanyCode": postData.CompanyCode,
    "PeriodYear": postData.PeriodYear,
    "PeriodMonth": postData.PeriodMonth,
    "MovingCode":"",
    "UserInfo": [
      {
        "LoginID": "DCBAPI001",
        "Password": "password.123"
      }
    ]
    }
  },
  {
    url: 'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsummonthly/list',

    headers: { 
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardSummaryMonthly"
    },

    body: {
      "CompanyCode" : postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "PeriodMonth": postData.PeriodMonth,
      "UserInfo":[
        {
         "LoginID":"DCBAPI001",
         "Password":"password.123"
        }
      ]
  }
  },{
    url: 'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsumyearly/list',

    headers: { 
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardSummaryYearly"
    },

    body: {
      "CompanyCode" : postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "UserInfo":[
        {
         "LoginID":"DCBAPI001",
         "Password":"password.123"
        }
      ]
  }
  },
  {
    url: 'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardtranssummary/list',

    headers: { 
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardByTransType"
    },

    body: {
      "CompanyCode": postData.CompanyCode,
      "MonthPeriod": fordate,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    }
  },
  {
    url: 'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsalestarget/list',

    headers: {
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardSalesTarget"
    },

    body: {
      "CompanyCode": postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "PeriodMonth": postData.PeriodMonth,
      "WorkingDays": postData.WorkingDays,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    }
  }
];

// Send multiple requests using Promise.all
async function sendMultipleRequests() {

    const promises = requests.map(async (request) => {
    try {
    const response = await axios.post(request.url, request.body, {
      headers: request.headers,
      timeout: 10000 // Timeout dalam milidetik (misalnya 5 detik)
    });
    return response.data;
    } catch (error) {
    console.error(`Error in request to ${request.url}: ${error.message}`);
    return null;
    }
    });
  
    const responses = await Promise.all(promises);
    
    const MovingCodeResult = responses[0] && responses[0].GetSparepartControlBoardMovingCodeResult !== undefined ? responses[0].GetSparepartControlBoardMovingCodeResult : null;
    const SummaryMonthlyResult = responses[1] && responses[1].GetSparepartControlBoardSummaryMonthlyResult !== undefined ? responses[1].GetSparepartControlBoardSummaryMonthlyResult : null;
    const SummaryYearlyResult = responses[2] && responses[2].GetSparepartControlBoardSummaryYearlyResult !== undefined ? responses[2].GetSparepartControlBoardSummaryYearlyResult : null;
    const ByTransTypeResult = responses[3] && responses[3].GetSparepartControlBoardByTransTypeResult !== undefined ? responses[3].GetSparepartControlBoardByTransTypeResult : null;
    const SalesTargetResult = responses[4] && responses[4].GetSparepartControlBoardSalesTargetResult !== undefined ? responses[4].GetSparepartControlBoardSalesTargetResult : null;


    if(MovingCodeResult){

      var TotalAmountMV = [];
      var AmountMV1;
      var AmountMV;
      var allmv= [];
      var persentase ;
      var JumlahAmountMV0;
      var JumlahAmountMV;
      var Inipersentasi ;
      var CompanyCode;
      var CompanyName;
      var PeriodYear;
      var PeriodMonth;
    
      var detailmovingCode = MovingCodeResult;
    
      detailmovingCode.forEach((drow) => {
          AmountMV1 = parseFloat(drow.TotalAmount/1000000);
          // AmountMV = Math.round(AmountMV1);
          AmountMV = parseInt(AmountMV1);
          TotalAmountMV.push(AmountMV);
      });
    
      let numbers = TotalAmountMV;
      var allTotalAmountMV = numbers.reduce((a, b) => a + b,0);
    
        detailmovingCode.forEach((drow) => {
          CompanyCode = drow.CompanyCode;
          CompanyName = drow.CompanyName;
          PeriodYear = drow.PeriodYear;
          PeriodMonth = drow.PeriodMonth;
          MovingCode = drow.MovingCode;
          JumlahAmountMV0 = parseFloat(drow.TotalAmount/1000000);
          // JumlahAmountMV = Math.round(JumlahAmountMV0);
          JumlahAmountMV = parseInt(JumlahAmountMV0);
          Inipersentasi = (JumlahAmountMV / allTotalAmountMV) * 100;
          persentase = Math.round(Inipersentasi);
          persentase = parseInt(persentase);
          
    
          allmv.push({"CompanyCode": CompanyCode,
          "CompanyName": CompanyName,
          "PeriodYear": PeriodYear,
          "PeriodMonth": PeriodMonth,
          "MovingCode": MovingCode,
          "TotalItem": JumlahAmountMV,
          "MovingCodePersen": persentase })
        });
    
      movingCode = allmv;
    }

    if(SummaryMonthlyResult){
      var CompanyName = 0;
      var CompanyCode = 0;
      var PeriodYear = 0;
      var PeriodMonth = 0;
      var AmountTarget = 0;
      var TotalAmountSales = 0;
    
      var sumMonthly_detail = SummaryMonthlyResult;
    
      sumMonthly_detail.forEach(drow => {
    
          CompanyCode = drow.CompanyCode;
          CompanyName = drow.CompanyName;
          PeriodYear = drow.PeriodYear,
          PeriodMonth = drow.PeriodMonth,
          AmountTarget = drow.TotalAmountTarget,
          TotalAmountSales = drow.TotalAmountSales
        
          if(AmountTarget){
            AmountTarget = parseFloat(AmountTarget/1000000);
            // AmountTarget = Math.round(AmountTarget);
            AmountTarget = parseInt(AmountTarget);
          }
    
          if(TotalAmountSales){
            TotalAmountSales = parseFloat(TotalAmountSales/1000000);
            // TotalAmountSales = Math.round(TotalAmountSales);
            TotalAmountSales = parseInt(TotalAmountSales);
          }
        
      });
      // console.log(AmountTarget);
      var Inipersentasi = (TotalAmountSales / AmountTarget) * 100;
      persentase = Math.round(Inipersentasi);
      persentase = parseInt(Inipersentasi);
    
      if(AmountTarget == 0){
        persentase = 0;
      }
    
      
      sumMonthly.push({"CompanyCode": CompanyCode,
      "CompanyName": CompanyName,
      "PeriodYear": PeriodYear,
      "PeriodMonth": PeriodMonth,
      "TotalAmountTarget": AmountTarget,
      "TotalAmountSales": TotalAmountSales,
      "TotalAmountSalesPersen" : persentase});
     
    }

    if(SummaryYearlyResult){
      var TotalAmountTargetSemester1;
      var TotalAmountTargetSemester2;
      var TotalAmountTargetYearly;

      var TotalAmountSalesSemester1;
      var TotalAmountSalesSemester2;
      var TotalAmountSalesYearly;

      var sumYearly_detail = SummaryYearlyResult;
      sumYearly_detail.forEach(drow => {
    
            CompanyCode = drow.CompanyCode;
            CompanyName = drow.CompanyName;
            PeriodYear = drow.PeriodYear,
            PeriodMonth = drow.PeriodMonth,
            AmountTarget = drow.TotalAmountTarget,
            TotalAmountTargetSemester1 = drow.TotalAmountTargetSemester1
            TotalAmountTargetSemester2 = drow.TotalAmountTargetSemester2
            TotalAmountSalesSemester1 = drow.TotalAmountSalesSemester1
            TotalAmountSalesSemester2 = drow.TotalAmountSalesSemester2
            TotalAmountTargetYearly = drow.TotalAmountTargetYearly
            TotalAmountSalesYearly= drow.TotalAmountSalesYearly
          
      });
      var TargetSemester1;
      var TargetSemester2;
      var TargetYear;
      var SalesSemester1;
      var SalesSemester2;
      var SalesYear;

      if(TotalAmountTargetSemester1){
        TargetSemester1 = parseFloat(TotalAmountTargetSemester1/1000000);
        // TargetSemester1 = Math.round(TargetSemester1);
        TargetSemester1 = parseInt(TargetSemester1);
      }

      if(TotalAmountTargetSemester2){
        TargetSemester2 = parseFloat(TotalAmountTargetSemester2/1000000);
        // TargetSemester2 = Math.round(TargetSemester2);
        TargetSemester2 = parseInt(TargetSemester2);
      }

      if(TotalAmountSalesSemester1){
        var SalesSemester1 = parseFloat(TotalAmountSalesSemester1/1000000);
        // var SalesSemester1 = Math.round(SalesSemester1);
        var SalesSemester1 = parseInt(SalesSemester1);
      }

      if(TotalAmountSalesSemester2){
        var SalesSemester2 = parseFloat(TotalAmountSalesSemester2/1000000);
        // var SalesSemester2 = Math.round(SalesSemester2);
        var SalesSemester2 = parseInt(SalesSemester2);
      }

      if(TotalAmountTargetYearly){
        var TargetYear = parseFloat(TotalAmountTargetYearly/1000000);
        // var TargetYear = Math.round(TargetYear);
        var TargetYear = parseInt(TargetYear);
      }

      if(TotalAmountSalesYearly){
        var SalesYear = parseFloat(TotalAmountSalesYearly/1000000);
        // var SalesYear = Math.round(SalesYear);
        var SalesYear = parseInt(SalesYear);
      }

      var persentaseSemester1 = (SalesSemester1 / TargetSemester1) * 100;
      persentaseSemester1 =  Math.round(persentaseSemester1);
      persentaseSemester1 = parseInt(persentaseSemester1);
      if(TargetSemester1 == 0){
        persentaseSemester1 = "0";
      }

      var persentaseSemester2 = (SalesSemester2 / TargetSemester2) * 100;
      persentaseSemester2 =  Math.round(persentaseSemester2);
      persentaseSemester2 = parseInt(persentaseSemester2);
      if(TargetSemester2 == 0){
        persentaseSemester2 = 0;
      }

      var persentaseYear = (SalesYear / TargetYear) * 100;
      persentaseYear =  Math.round(persentaseYear);
      persentaseYear = parseInt(persentaseYear);
      if(TargetYear == 0){
        persentaseYear = 0;
      }

      sumYearly.push({
        "CompanyCode": CompanyCode,
        "CompanyName": CompanyName,
        "PeriodYear": PeriodYear,
        "TotalAmountTargetSemester1": TargetSemester1,
        "TotalAmountSalesSemester1": SalesSemester1,
        "PersentaseSemester1": persentaseSemester1,

        "TotalAmountTargetSemester2": TargetSemester2,
        "TotalAmountSalesSemester2": SalesSemester2,
        "persentaseSemester2": persentaseSemester2,

        "TotalAmountTargetYearly": TargetYear,
        "TotalAmountSalesYearly": SalesYear,
        "PersentaseYear": persentaseYear,
    })
    }

    if(ByTransTypeResult){
        var detailTypeTran = ByTransTypeResult;

        var allTotalAmount = [];
        var alltypetrans= [];
        var JumlahTypetrans;
        var TransTypeDesc;
        var persentase ;
        var Inipersentasi ;
      
        detailTypeTran.forEach((drow) => {
          JumlahTypetrans = parseFloat(drow.TotalAmount/1000000);
          // JumlahTypetrans = Math.round(JumlahTypetrans);
          JumlahTypetrans = parseInt(JumlahTypetrans);
          allTotalAmount.push(parseInt(JumlahTypetrans));
        });
      
        let numbers2 = allTotalAmount;
      
        var allTotalType = numbers2.reduce((a, b) =>a + b, 0);
      
        detailTypeTran.forEach((drow) => {
        
          JumlahTypetrans = parseFloat(drow.TotalAmount/1000000);
          // JumlahTypetrans = Math.round(JumlahTypetrans);
          JumlahTypetrans = parseInt(JumlahTypetrans);
          Inipersentasi = (JumlahTypetrans / allTotalType) * 100;
          persentase = Math.round(Inipersentasi);
          persentase = parseInt(persentase);
      
          alltypetrans.push({"CompanyCode": drow.CompanyCode,
          "CompanyName": drow.CompanyName,
          "MonthPeriode": drow.MonthPeriode,
          "TransType": drow.TransType,
          "TransTypeDesc": TransTypeDesc,
          "TotalAmount": JumlahTypetrans,
          "TotalAmountPersen": persentase,
        })
        });
      
        TypeTran = alltypetrans;
      
    }

    if(SalesTargetResult){

        const company_holidays = [];

        var newdata = [];
        if(bulan == "10"){
          var addbil = 1;
          var bulanplus = (parseInt(addbil) + parseInt(bulan));
        }else{
          const bulanwithoutzero = bulan.replace('0', '')
          var addbil = 1;
          var bulanplus = (parseInt(addbil) + parseInt(bulanwithoutzero));
        }

        if(bulanplus >= 13 ){
          bulanplus = '0' + 1;
          var tahunplus = (parseInt(addbil) + parseInt(tahun));  
        }
        else if(bulanplus <= 9){
        bulanplus = '0' + bulanplus;
        }else{
        bulanplus = bulanplus;
        }

        if(tahunplus){
          var start_date = `"${tahun}-${bulan}-01"`
          var end_date = `"${tahunplus}-${bulanplus}-01"`
          var type = "days"
        }else{
          var start_date = `"${tahun}-${bulan}-01"`
          var end_date = `"${tahun}-${bulanplus}-01"`
          var type = "days"
        }

        moment.suppressDeprecationWarnings = true;
        let fromDate = moment(start_date)
        let toDate = moment(end_date)
        diff = toDate.diff(fromDate, type);

        var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
        const rangedate = [];
      
        for (let i = 0 ; i < diff; i++) {
          var new_date = moment(start_date, "YYYY-MM-DD").add('days', i);
          var date = new Date(new_date);
          var thisDay = date.getDay();
          thisDay = myDays[thisDay];
          rangedate.push(thisDay);
        }

        const arr = rangedate;

        var counts = arr.reduce((acc, value) => ({
        ...acc,
        [value]: (acc[value] || 0) + 1
        }), {});  
          

        const mingguDates = rangedate.reduce((dates, day, index) => {
          if (day === 'Minggu') {
            const newDate = moment(start_date, 'YYYY-MM-DD').add(index, 'days').format('YYYY-MM-DD');
            var arrayminggu = { date: newDate, description: "minggu" };
            company_holidays.push(arrayminggu);
          }
          return dates;
        },[]);

        var minggu = counts['Minggu'];

        var total_workingdays = (parseInt(diff) - parseInt(minggu));  


        const allcompanyholidays1 = "Allcompany";
        const result = await connection.query(`SELECT holidays_date, description FROM holidays WHERE (companycode = $1 OR companycode = $4) AND EXTRACT(MONTH FROM TO_DATE(holidays_date, 'YYYY-MM-DD')) = $2 AND EXTRACT(YEAR FROM TO_DATE(holidays_date, 'YYYY-MM-DD')) = $3`, [postData.CompanyCode, inputbulan, inputtahun,allcompanyholidays1]);
          
        var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dataArray = [];
          
        result.rows.forEach(row => {
          const inputDate = row.holidays_date;
          var new_date = moment(inputDate).add('day').format('YYYY-MM-DD'); // Menambahkan 1 hari menggunakan moment.js
          var date = new Date(new_date);
          var thisDay = date.getDay();
          thisDay = myDays[thisDay];
          if (thisDay != "Minggu") {
            dataArray.push(thisDay);
          }
        });
            
        // const uniqueDataArray = [...new Set(dataArray)];
        const count = dataArray.length;

        var allworkingdays = parseInt(total_workingdays);
      
        if (count > 0) {
          allworkingdays = parseInt(total_workingdays) - count;
        }

        var CompanyCode = 0;
        var CompanyName = 0;
        var PeriodYear = 0;
        var PeriodMonth = 0;
      
        SalesTargetResult.forEach((drow) => {
          CompanyCode = drow.CompanyCode;
          CompanyName = drow.CompanyName;
          PeriodYear = drow.PeriodYear;
          PeriodMonth = drow.PeriodMonth;
          AmountTargetMon = drow.AmountTarget;
        });
        var AverageTarget1 = 0;

        if (AmountTargetMon) {
          AmountTargetMon = parseFloat(AmountTargetMon) / 1000000; // Ubah ke float sebelum membagi
          // AmountTargetMon = Math.round(AmountTargetMon);
          AmountTargetMon = parseInt(AmountTargetMon);
          var AverageTarget1 = parseFloat(AmountTargetMon) / allworkingdays; // Ubah ke float sebelum membagi
          // AverageTarget1 = Math.round(AverageTarget1);
          AverageTarget1 = parseInt(AverageTarget1);
        }
      
        newdata.push({
                "CompanyCode": CompanyCode,
                "CompanyName": CompanyName,
                "PeriodYear": PeriodYear,
                "PeriodMonth": PeriodMonth,
                "AmountTarget": AmountTargetMon,
                "Workingdays": allworkingdays,
                "Average": AverageTarget1
              });

        //======================================== HIT DAILY DETAIL ====================
        var latestUpdatedAt; 
        var uniqueDataHolidays;

        const allconfig = await connection.query(
          `SELECT * FROM daily WHERE companycode = $1 AND TO_CHAR(dateperiode::date, 'MM') = $2 AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 ORDER BY dateperiode ASC`,
          [companycode, bulan, tahun]
        )

        const result1 = await connection.query(
          `SELECT TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as latest_updated_at FROM daily WHERE companycode = $1 AND TO_CHAR(dateperiode::date, 'MM') = $2 AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 ORDER BY updated_at DESC LIMIT 1`,
          [companycode, bulan, tahun]
        );
     
        if (result1.rows.length > 0) {
          latestUpdatedAt = result1.rows[0].latest_updated_at;
          console.log('Latest Updated at:', latestUpdatedAt);
        } else {
          console.log('No data found');
        }

        const allcompanyholidays = "Allcompany";
        try {
          
          const result = await query(`SELECT holidays_date, description FROM holidays WHERE (companycode = $1 OR companycode = $2) AND EXTRACT(MONTH FROM TO_DATE(holidays_date, 'YYYY-MM-DD')) = $3 AND EXTRACT(YEAR FROM TO_DATE(holidays_date, 'YYYY-MM-DD')) = $4`, [companycode,allcompanyholidays, inputbulan, inputtahun]);

          result.rows.forEach(row => {
            const inputDate = row.holidays_date;
            const formattedDate = moment(inputDate).add('day').format('YYYY-MM-DD');
            const description = row.description;
            const data = { date: formattedDate, description: description };
            company_holidays.push(data);
          });
        } catch (error) {
          console.error('Error querying database:', error);
        }

        uniqueDataHolidays = Array.from(new Set(company_holidays.map(item => item.date))).map(date => {
          return company_holidays.find(item => item.date === date);
        });

        console.log(uniqueDataHolidays);

        const MaxAkumulasi = [];
        var dataamount = [];
        var x = 1;
        var y = 1;

        allconfig.rows.forEach((drow) => {
          var Hari = 0;
          var total = 0;
          var Balance = 0;
          var CompanyCode = companycode;
          var CompanyName = "";
          var DatePeriode = 0;

          tanggal = drow.tanggal;
          CompanyName = drow.companyname;
          DatePeriode = drow.dateperiode;
          total = drow.amount;

          dataamount.push(total);

          var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

          if(DatePeriode != ""){
            const inputDate = DatePeriode;
            var new_date = moment(inputDate).add('day').format('YYYY-MM-DD');
            var date = new Date(new_date);
            var thisDay = date.getDay();
            thisDay = myDays[thisDay];

            if(thisDay == "Minggu"){
              var isHoliday = true;
            }else{
              var isHoliday = false;
            }
            
            company_holidays.forEach(element => {
              if(element.date == DatePeriode ){
                isHoliday = true;
              }
            });
          } 

          if(total != 0){
              //amount ada tapi holidays
              if(isHoliday == true){
                Hari = 0;
              }else{
                Hari = x++;
              }
          }else{

            if(isHoliday == true){
            Hari = 0;
            }

            if(isHoliday == false){
              Hari = x++;
            }
          }

          var tanggal = y++
          let numbers = dataamount;
          var Akumulasi = 0;

          Akumulasi = numbers.reduce((acc, curr) =>  acc + parseInt(curr), 0);

          MaxAkumulasi.push(Akumulasi);

          Balance = Akumulasi-(AverageTarget1 * Hari);
          
            if(total == 0){
              Akumulasi = 0;
              Balance = 0;
              databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
            }else{
              databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
            }
            
          });

    }

    const sum = [{"UpdateDaily" :latestUpdatedAt ,"CompanyHolidays": uniqueDataHolidays,"Daily" : databaru,"TargetMonthly" : newdata , "TargetYearly" : TargetYearly,"MovingCode" : movingCode ,"TypeTran" : TypeTran ,"MonAchi" : sumMonthly ,"YearAchi": sumYearly} ]
    return res.json(sum);
   
}

sendMultipleRequests();
};