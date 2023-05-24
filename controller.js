'use strict';

var response = require('./res');
var connection = require('./db');
const fetch = require("node-fetch");
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

//Untuk Get login Profile from DMS
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
        
            const resp = await fetch('http://apitest.hinodms.co.id/Request.ashx', {
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

//function as MIDDLEWARE for Booking data Board that directly take data from DMS
exports.BookingAllocation = function (req, res) {
  try {
    const postData = req.body;

    const agent = new https.Agent({  
      rejectUnauthorized: false
    });

    const headers = { 
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetBookingInfoRegister"
    };

    const article = {
      "CompanyCode": postData.CompanyCode,
      "VehicleChassisNo": "",
      "BookingDocNo": "",
      "BookingServDate": postData.BookingServDate,
      "BookingServTime": "",
      "CpContactViaCode": "",
      "DealerRepCode": "",
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

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/bookinginfo/list', article, {
      headers,
      httpsAgent: agent
    })
      .then(async (response) => {
        return res.json(response.data);
      })
      .catch(error =>{ return res.send(JSON.stringify(error))});
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//function as MIDDLEWARE for WORKINFO data Board that directly take data from DMS
exports.workInfo = function (req, res) {
  try {
    const postData = req.body;
    console.log(postData.CompanyCode);
    console.log(postData.LastUpdate);

    const article = {
      "CompanyCode": postData.CompanyCode,
      "WoSysNo": "",
      "WoDocNo": "",
      "LastUpdate": "",
      "StartDate": postData.StartDate,
      "EndDate": postData.EndDate,
      "DealerRepCode": "",
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    const headers = {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
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
      httpsAgent: agent
    })
      .then(async (response) => {
        return res.json(response.data);
      })
      .catch(error =>{ return res.send(JSON.stringify(error))});
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.masterrepcode = async function (req, res) {
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
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetDealerRepCodeRegister"
    };

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/masterrepcode/list', dataarticle, {
      headers,
      httpsAgent: agent
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};


exports.holiday = async (req, res) => {
  try {
    const crudType = req.headers.crudtype;
    const { CompanyCode, Description, Holidays_date, Active } = req.body;

    let text = '';
    let values = [];

    if (crudType === "insert") {
      text = 'INSERT INTO holidays(companycode, description, holidays_date, active) VALUES ($1, $2, $3, $4) RETURNING *';
      values = [CompanyCode, Description, Holidays_date, Active];
    } else if (crudType === "update") {
      text = 'UPDATE holidays SET companycode = $1, description = $2, active = $4 WHERE holidays_date = $3';
      values = [CompanyCode, Description, Holidays_date, Active];
    } else if (crudType === "delete") {
      text = 'DELETE FROM holidays WHERE holidays_date = $1';
      values = [Holidays_date];
    } else {
      return res.status(400).json({ Message: "Not known CRUD Type!" });
    }

    try {
      const resCrud = await connection.query(text, values);
      return res.json({ Message: "Operation successful!" });
    } catch (err) {
      console.error(err.stack);
      return res.status(500).json({ Message: err.message });
    }
  } catch (err) {
    console.error(err.message);
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
    const { all } = "all";

    // Retrieve videos from the database based on companycode
    const results = await connection.query('SELECT * FROM videos WHERE companycode = $1 OR companycode = $2', [companycode, all]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'No videos found for the specified companycode' });
    }

    const videos = results.rows;
    return res.json(videos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.all_video = async (req, res) => {
  try {
    // Ambil informasi video dari database
    const results = await connection.query('SELECT * FROM public.videos ORDER BY id ASC');

    if (results.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
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
      return res.status(404).json({ message: 'Video not found' });
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

exports.spektrumku =  async (req, res) => {
  var postData = JSON.parse(JSON.stringify(req.body));

  var companycode =postData.CompanyCode;
  var inputbulan = postData.PeriodMonth;
  var inputtahun = postData.PeriodYear;
  var bulan = postData.PeriodMonth;
  var tahun = postData.PeriodYear;

  var fordate = `${inputtahun}-${inputbulan}`
  var TargetMonthly;
  var TargetYearly;
  var sumMonthly = [];
  const dataArray1 = [];
  var sumYearly= [];
  var rataTarget = [];
  var AmountTargetMon = 0;
  var AverageTarget1;
  let diff;

  var MovingCode;
  var TypeTran;
  var movingCode;

  var resJ=[];
  const agent = new https.Agent({  
   rejectUnauthorized: false
 });

 //======================================== HIT MOVING CODE ====================
 try {
  const postData = req.body;

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const headers = {
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardMovingCode"
  };

  const data = {
    "CompanyCode": postData.CompanyCode,
    "PeriodYear": postData.PeriodYear,
    "PeriodMonth": postData.PeriodMonth,
    "MovingCode": postData.MovingCode,
    "UserInfo": [
      {
        "LoginID": "DCBAPI001",
        "Password": "password.123"
      }
    ]
  };

  const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardmovingcode/list', data, {
    headers,
    httpsAgent: agent
  });

  var TotalItem = [];
  var allmv= [];
  var persentase ;
  var JumlahItem;
  var Inipersentasi ;

  var detailmovingCode = response.data.GetSparepartControlBoardMovingCodeResult;

  detailmovingCode.forEach((drow) => {
    TotalItem.push(parseInt(drow.TotalItem));
  });
  
  let numbers = TotalItem;
  var allTotalItem = numbers.reduce((a, b) => a + b);

  detailmovingCode.forEach((drow) => {
    CompanyCode = drow.CompanyCode;
    CompanyName = drow.CompanyName;
    PeriodYear = drow.PeriodYear;
    PeriodMonth = drow.PeriodMonth;
    MovingCode = drow.MovingCode;
    JumlahItem = parseInt(drow.TotalItem);
    Inipersentasi = (JumlahItem / allTotalItem) * 100;
    persentase = Math.round(Inipersentasi);
    

    allmv.push({"CompanyCode": CompanyCode,
    "CompanyName": CompanyName,
    "PeriodYear": PeriodYear,
    "PeriodMonth": PeriodMonth,
    "MovingCode": MovingCode,
    "TotalItem": drow.TotalItem,
    "MovingCodePersen": persentase})

  });

  movingCode = allmv;
 
} catch (error) {
  return res.status(500).send(error.message);
}


//======================================== HIT SUM MONTHLY ====================
try {

  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const headers = { 
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardSummaryMonthly"
  };

  const data = {
      "CompanyCode" : postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "PeriodMonth": postData.PeriodMonth,
      "UserInfo":[
        {
         "LoginID":"DCBAPI001",
         "Password":"password.123"
        }
      ]
  };

  const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsummonthly/list', data, {
    headers,
    httpsAgent: agent
  });

  var CompanyName = 0;
  var CompanyCode = 0;
  var PeriodYear = 0;
  var PeriodMonth = 0;
  var AmountTarget = 0;
  var TotalAmountSales = 0;

  var sumMonthly_detail = response.data.GetSparepartControlBoardSummaryMonthlyResult;
  // console.log(sumMonthly_detail);
  sumMonthly_detail.forEach(drow => {

      CompanyCode = drow.CompanyCode;
      CompanyName = drow.CompanyName;
      PeriodYear = drow.PeriodYear,
      PeriodMonth = drow.PeriodMonth,
      AmountTarget = drow.TotalAmountTarget,
      TotalAmountSales = drow.TotalAmountSales
    
      if(AmountTarget){
        AmountTarget = parseFloat(AmountTarget/100000);
        AmountTarget = Math.round(AmountTarget);
        AmountTarget = parseInt(AmountTarget);
      }

      if(TotalAmountSales){
        TotalAmountSales = parseFloat(TotalAmountSales/100000);
        TotalAmountSales = Math.round(TotalAmountSales);
        TotalAmountSales = parseInt(TotalAmountSales);
      }
    
  });
  // console.log(AmountTarget);
  var Inipersentasi = (TotalAmountSales / AmountTarget) * 100;
  persentase = Math.round(Inipersentasi);

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
 
} catch (error) {
  return res.status(500).send(error.message);
}

//======================================== HIT SUM YEARLY ====================
try {
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const headers = { 
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardSummaryYearly"
  };

  const data = {
      "CompanyCode" : postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "UserInfo":[
        {
         "LoginID":"DCBAPI001",
         "Password":"password.123"
        }
      ]
  };

  const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsumyearly/list', data, {
    headers,
    httpsAgent: agent
  });

  var TotalAmountTargetSemester1;
  var TotalAmountTargetSemester2;
  var TotalAmountTargetYearly;

  var TotalAmountSalesSemester1;
  var TotalAmountSalesSemester2;
  var TotalAmountSalesYearly;

   var sumYearly_detail = response.data.GetSparepartControlBoardSummaryYearlyResult;
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
    TargetSemester1 = parseFloat(TotalAmountTargetSemester1/100000);
    TargetSemester1 = Math.round(TargetSemester1);
    TargetSemester1 = parseInt(TargetSemester1);
  }

  if(TotalAmountTargetSemester2){
    TargetSemester2 = parseFloat(TotalAmountTargetSemester2/100000);
    TargetSemester2 = Math.round(TargetSemester2);
    TargetSemester2 = parseInt(TargetSemester2);
  }

  if(TotalAmountSalesSemester1){
    var SalesSemester1 = parseFloat(TotalAmountSalesSemester1/100000);
    var SalesSemester1 = Math.round(SalesSemester1);
    var SalesSemester1 = parseInt(SalesSemester1);
  }

  if(TotalAmountSalesSemester2){
    var SalesSemester2 = parseFloat(TotalAmountSalesSemester2/100000);
    var SalesSemester2 = Math.round(SalesSemester2);
    var SalesSemester2 = parseInt(SalesSemester2);
  }

  if(TotalAmountTargetYearly){
    var TargetYear = parseFloat(TotalAmountTargetYearly/100000);
    var TargetYear = Math.round(TargetYear);
    var TargetYear = parseInt(TargetYear);
  }

  if(TotalAmountSalesYearly){
    var SalesYear = parseFloat(TotalAmountSalesYearly/100000);
    var SalesYear = Math.round(SalesYear);
    var SalesYear = parseInt(SalesYear);
  }

  var persentaseSemester1 = (SalesSemester1 / TargetSemester1) * 100;
  persentaseSemester1 = Math.round(persentaseSemester1);
  if(TargetSemester1 == 0){
    persentaseSemester1 = "0";
  }

  var persentaseSemester2 = (SalesSemester2 / TargetSemester2) * 100;
  persentaseSemester2 = Math.round(persentaseSemester2);
  if(TargetSemester2 == 0){
    persentaseSemester2 = 0;
  }

  var persentaseYear = (SalesYear / TargetYear) * 100;
  persentaseYear = Math.round(persentaseYear);
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
 
} catch (error) {
  return res.status(500).send(error.message);
}

//======================================== HIT TARGET MONTHLY ====================
try {

  const headers = { 
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardByTransType"
  };

  const data = {
    "CompanyCode": postData.CompanyCode,
    "MonthPeriod": fordate,
    "UserInfo": [
      {
        "LoginID": "DCBAPI001",
        "Password": "password.123"
      }
    ]
  };

  const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardtranssummary/list', data, {
    headers,
    httpsAgent: agent
  });

  var detailTypeTran = response.data.GetSparepartControlBoardByTransTypeResult;

  var allTotalAmount = [];
  var alltypetrans= [];
  var JumlahTypetrans;
  var TransTypeDesc;
  var persentase ;
  var Inipersentasi ;

  detailTypeTran.forEach((drow) => {
    JumlahTypetrans = parseFloat(drow.TotalAmount/1000000);
    JumlahTypetrans = Math.round(JumlahTypetrans);
    JumlahTypetrans = parseInt(JumlahTypetrans);
    allTotalAmount.push(parseInt(JumlahTypetrans));
  });

  let numbers2 = allTotalAmount;
  var allTotalType = numbers2.reduce((a, b) => a + b);

  detailTypeTran.forEach((drow) => {
  
    JumlahTypetrans = parseFloat(drow.TotalAmount/1000000);
    JumlahTypetrans = Math.round(JumlahTypetrans);
    JumlahTypetrans = parseInt(JumlahTypetrans);
    Inipersentasi = (JumlahTypetrans / allTotalType) * 100;
    persentase = Math.round(Inipersentasi);

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
  
} catch (error) {
  return res.status(500).send(error.message);
}


//======================================== HIT TARGET MONTHLY ====================
try {

  var newdata = [];
  if(bulan == "10"){
    var addbil = 1;
    var bulanplus = (parseInt(addbil) + parseInt(bulan));
  }else{
    const bulanwithoutzero = bulan.replace('0', '')
    var addbil = 1;
    var bulanplus = (parseInt(addbil) + parseInt(bulanwithoutzero));
  }

  if  (bulanplus >= 13 ){
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

  var minggu = counts['Minggu'];

  var total_workingdays = (parseInt(diff) - parseInt(minggu));  

  const data = {
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
  };
  
  const headers = {
    "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
    "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardSalesTarget"
  };
  
  try {
    const response = await axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsalestarget/list', data, {
      headers,
      httpsAgent: agent
    });
  
    const result = await connection.query('SELECT holidays_date, description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [postData.CompanyCode, inputbulan, inputtahun]);
  
    var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dataArray = [];
  
    result.rows.forEach(row => {
      const inputDate = row.holidays_date;
      var new_date = moment(inputDate).add(1, 'day').format('YYYY-MM-DD'); // Menambahkan 1 hari menggunakan moment.js
      var date = new Date(new_date);
      var thisDay = date.getDay();
      thisDay = myDays[thisDay];
      if (thisDay != "Minggu") {
        dataArray.push(thisDay);
      }
    });
  
    const count = dataArray.length;
    var allworkingdays = parseInt(total_workingdays);
  
    if (count > 0) {
      allworkingdays = parseInt(total_workingdays) - count;
    }
  
    var CompanyCode = 0;
    var CompanyName = 0;
    var PeriodYear = 0;
    var PeriodMonth = 0;
    // console.log(response.data.GetSparepartControlBoardSalesTargetResult);
    response.data.GetSparepartControlBoardSalesTargetResult.forEach((drow) => {
      CompanyCode = drow.CompanyCode;
      CompanyName = drow.CompanyName;
      PeriodYear = drow.PeriodYear;
      PeriodMonth = drow.PeriodMonth;
      AmountTargetMon = drow.AmountTarget;
    });
    // console.log(AmountTarget);
    if (AmountTargetMon) {
      AmountTargetMon = parseFloat(AmountTargetMon) / 100000; // Ubah ke float sebelum membagi
      AmountTargetMon = Math.round(AmountTargetMon);
      AmountTargetMon = parseInt(AmountTargetMon);
      var AverageTarget1 = parseFloat(AmountTargetMon) / allworkingdays; // Ubah ke float sebelum membagi
      AverageTarget1 = Math.round(AverageTarget1);
    }
  
    console.log("Jumlah Hari dalam 1 bulan =", diff); // Variabel diff belum didefinisikan
    console.log("Jumlah Hari Minggu =", minggu); // Variabel minggu belum didefinisikan
    console.log("Jumlah Hari Holiday =", count);
    console.log("Jumlah total Workingday =", allworkingdays);
  
    newdata.push({
            "CompanyCode": CompanyCode,
            "CompanyName": CompanyName,
            "PeriodYear": PeriodYear,
            "PeriodMonth": PeriodMonth,
            "AmountTarget": AmountTargetMon,
            "Workingdays": allworkingdays,
            "Average": AverageTarget1
          });
  
    } catch (error) {
      res.status(500).send(error.message);
    }


  } catch (error) {
    return res.status(500).send(error.message);
  }


// //======================================== HIT DAILY DETAIL ====================

//       const headers = { 
//       "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
//       "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
//       "Content-Type": "application/json",
//       "ID": "hmsi",
//       "Pwd": "hmsi:hmsipassword123",
//       "ProcFlag": "GetSparepartControlBoardDetail"
//       };

//       var new_tanggal;
//       // console.log(CompanyCode);
//       try {
//         const result = await query('SELECT holidays_date, description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [postData.CompanyCode, inputbulan, inputtahun]);
      
//         result.rows.forEach(row => {
//           const inputDate = row.holidays_date;
//           const formattedDate = moment(inputDate).add('day').format('YYYY-MM-DD');
//           const description = row.description;
//           const data = { date: formattedDate, description: description };
//           dataArray1.push(data);
//           // console.log(dataArray1);
//         });
//       } catch (error) {
//         console.error('Error querying database:', error);
//       }
  
//       const rangedate1 = [];
//       for (let i = 0 ; i < diff; i++) {

//       var new_date = moment(start_date, "YYYY-MM-DD").add('days', i);
//       rangedate1.push(new_date);

//       }

//       const requests = rangedate1.map((i) => {  

//         var day = i.format('DD');
//         var month = i.format('MM');
//         var year = i.format('YYYY');
//         new_tanggal = (year + '-' + month + '-' + day);

//         const databody =
//         {
//             "CompanyCode":postData.CompanyCode,
//             "DatePeriod":new_tanggal,
//             "UserInfo":[
//               {
//               "LoginID":"DCBAPI001",
//               "Password":"password.123"
//               }
//             ]
//         };

//         return axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list', databody, { headers , httpsAgent: agent  })
//         });
      
//         axios.all(requests).then((responses) => {

//         const databaru = [];
//         const MaxAkumulasi = [];
//         var dataamount = [];
//         var x = 1;
//         var y = 1;
        
//         responses.forEach((resp) => {
//           var new_tanggal = resp.config.data; // Access DatePeriod
//           var jsonString = new_tanggal;
//           var jsonObject = JSON.parse(jsonString);
         
//           var detail =  resp.data.GetSparepartControlBoardDetailResult;
//           var Hari = 0;
//           var total = 0;
//           var total1 = 0;
//           var total2 = 0;
//           var total3 = 0;
//           var Balance = 0;
//           var CompanyCode = postData.CompanyCode;
//           var CompanyName = "";
//           var DatePeriode = jsonObject.DatePeriod;

//           detail.forEach((drow) => {
            
//             CompanyCode = drow.CompanyCode;
//             CompanyName = drow.CompanyName;
//             DatePeriode = drow.DatePeriode;
//             total += parseFloat(drow.TotalAmount);
//             total1 = parseFloat(total/100000);
//             total2 = Math.round(total1);
//             total3 = parseInt(total2);
           
//           });

//           dataamount.push(total3);

//           var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
//           if(DatePeriode != ""){
//             const inputDate = DatePeriode;
//             var new_date = moment(inputDate).add('day').format('YYYY-MM-DD');
//             var date = new Date(new_date);
//             var thisDay = date.getDay();
//             thisDay = myDays[thisDay];

//             if(thisDay == "Minggu"){
//               var isHoliday = true;
//             }else{
//               var isHoliday = false;
//             }
            
//             dataArray1.forEach(element => {
//               if(element.date == DatePeriode ){
//                 isHoliday = true;
//               }
//             });
//           } 

//           if(total3 != 0){
//               //amount ada tapi holidays
//               if(isHoliday == true){
//                 Hari = 0;
//               }else{
//                 Hari = x++;
//               }
//           }else{

//             if(isHoliday == true){
//             Hari = 0;
//             }

//             if(isHoliday == false){
//               Hari = x++;
//             }

//           }
//           var tanggal = y++
//           // console.log(dataamount);
//           let numbers = dataamount;
//           var Akumulasi = numbers.reduce((a, b) => a + b);

//           MaxAkumulasi.push(Akumulasi);
//           const maxNumber = Math.max(Akumulasi);
         
//           Balance = Akumulasi-(AverageTarget1 * Hari);

//           var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          
//             if(total3 == 0){
//               Akumulasi = 0;
//               Balance = 0;
//               databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total3,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
//             }else{
//               databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total3,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
//             }
           
//           });
//           // console.log(MaxAkumulasi);
//           const maxNumber = Math.max(...MaxAkumulasi);
//           console.log(maxNumber);
//           var PersenAchivMon = parseInt(maxNumber);

//           PersenAchivMon = (PersenAchivMon / AmountTargetMon) * 100;
//           PersenAchivMon = Math.round(PersenAchivMon);

//           if(AmountTargetMon == 0 ){
//             PersenAchivMon = 0;
//           }

//           const sum = [{"PersenAchivMon" : PersenAchivMon ,"Daily" : databaru,"TargetMonthly" : newdata , "TargetYearly" : TargetYearly,"MovingCode" : movingCode ,"TypeTran" : TypeTran ,"MonAchi" : sumMonthly ,"YearAchi": sumYearly} ]
//           return res.json(sum);
          
//       })
//       .catch((error =>{ return res.send((error)); }));

        const sum = [{"TargetMonthly" : newdata , "TargetYearly" : TargetYearly,"MovingCode" : movingCode ,"TypeTran" : TypeTran ,"MonAchi" : sumMonthly ,"YearAchi": sumYearly} ]
          return res.json(sum);
};