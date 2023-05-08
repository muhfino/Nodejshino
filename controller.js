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
// const FileType = require('file-type');

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


console.log(jwt);
exports.index = function (req, res) {
    response.ok("Haloo,Aplikasi REST API ku berjalan!", res)
};

//Show data config based on id
exports.tampilberdasarkanid = function (req, res) {
    let id = req.params.id;
    connection.query('SELECT * FROM config WHERE id = ?', [id],
        function (error, rows, fields) {
            if (error) {
                console.log(error);
            } else {
                response.ok(rows, res);
            }
        });
};

//Show data for All Data configuration
exports.showconfig = async (req, res) => {
    try {
            const allconfig = await connection.query('SELECT * FROM public.config');
            res.json(allconfig.rows);
        } catch (err) {
            console.error(err.message);
        }   
};

//CRUD Config
exports.crudConfig = async (req, res) => {
    var crudType = req.headers.crudtype;
     try {
            var condition = req.body.condition;
            var description = req.body.description;
            var valuenum = req.body.valuenum;
            var valuetext = req.body.valuetext;
            var company_id = req.body.company_id;
            var active = req.body.active;
            var idconfig = req.body.id;
            
            //console.log('condition : ' +condition);

            if (crudType == "insert") {
                var text = 'INSERT INTO config(condition, description, valuenum, valuetext, company_id, active)	VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
                var value =  [condition, description, valuenum, valuetext, company_id, active];
            } 
            else if (crudType == "update" )
            {
                var text = 'UPDATE config set condition = $1, description = $2, valuenum = $3, valuetext = $4, company_id = $5, active = $6 Where id = $7'
                var value =  [condition, description, valuenum, valuetext, company_id, active, idconfig];
            }
            else if (crudType == "delete" )
            {
                var text = 'DELETE from config Where id = $1'
                var value =  [idconfig];
            }
            else {
                var text = 'EXIT'
                var value =  [idconfig];
            }
            
            try {
                if (text !== "EXIT") {
                    const resCrud = await connection.query(text, value);
                    //console.log(resCrud.rows[0]);
                    //res.json(resCrud.rows[0]);
                    response.ok("Operation succesfull!", res);
                } else {
                    var FailRes = {};                
                    FailRes["Message"] ='Not known CRUD Type!';
                    response.failed(FailRes, res);
                }
                
            } catch (err) {
                var FailRes = {};
                
                FailRes["Message"] =err.message;
                response.failed(FailRes, res);
                console.log(err.stack);
            }
        } catch (err) {
            console.error(err.message);
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
                    response.okLogin(allCompany.rows,data.access_token, res);
                } catch (err) {
                    console.error(err.message);
                }
            } else {
                var NewjsonUser = {};
            
                NewjsonUser["CompanyCode"] =jsonUser.GetUserProfileResult[0].CompanyCode;
                NewjsonUser["CompanyName"] =jsonUser.GetUserProfileResult[0].CompanyName;
    
            // NewjsonUser.map(({CompanyCode, CompanyName}) => ({CompanyCode, CompanyName}));
    
                //console.log(NewjsonUser);
                
                response.okLogin(NewjsonUser,data.access_token, res);
            }
                
            }else{
                var NewFailedUser = {};
                
                NewFailedUser["CompanyCode"] =null;
                NewFailedUser["CompanyName"] =null;
                response.failed(NewFailedUser, res);
            }
            
            
        
        } catch (err) {
            console.error('error'+err.message);
        }
};

//function as MIDDLEWARE for Booking data Board that directly take data from DMS
exports.BookingAllocation = function (req, res) {
    var resJ=[];
  //res.send(req.body.phone+'post'+req.params.phone)
   // At request level
   const agent = new https.Agent({  
    rejectUnauthorized: false
  });

  var postData = JSON.parse(JSON.stringify(req.body));;

  // POST request using axios with set headers
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

  const headers = { 
    "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
    "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetBookingInfoRegister"
   
  };
  axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/bookinginfo/list', article, { headers , httpsAgent: agent  })
      .then(async(response) =>{ 
       
        res.json(response.data);
        console.log(response.data);
      })
      .catch(error => res.send(JSON.stringify(error)))
}

//function as MIDDLEWARE for WORKINFO data Board that directly take data from DMS
exports.workInfo = function (req, res) {
    var resJ=[];
    //res.send(req.body.phone+'post'+req.params.phone)
     // At request level
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    //console.log(req.body)
    var postData = JSON.parse(JSON.stringify(req.body));;
    console.log(postData.CompanyCode);
    console.log(postData.LastUpdate);
    

    const article = {
        "CompanyCode":postData.CompanyCode,
        "WoSysNo":"",
        "WoDocNo":"",
        "LastUpdate":"",
        "StartDate":postData.StartDate,
        "EndDate":postData.EndDate,
        "DealerRepCode":"",
        "UserInfo":[
          {
           "LoginID":"DCBAPI001",
           "Password":"password.123"
          }
        ]
    };

    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetWorkInfoRegister"

    };
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/workinfo/list', article, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 
          //console.log(response);
          res.json(response.data);
        })
        .catch(error => res.send(JSON.stringify(error)))
}

exports.masterrepcode = function (req, res) {
    var resJ=[];
    //res.send(req.body.phone+'post'+req.params.phone)
     // At request level
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    //console.log(req.body)
    var postData = JSON.parse(JSON.stringify(req.body));;
    // POST request using axios with set headers
    const dataarticle =
    {
        "CompanyCode":postData.CompanyCode,
        "StartDate":"",
        "EndDate":"",
        "LastUpdateDate":postData.LastUpdateDate,
        "Status":"",
        "DealerRepCode":"",
        "ProfitCenterCode":postData.ProfitCenterCode,
        "UserInfo":[
            {
            "LoginID":"DCBAPI001",
            "Password":"password.123"
            }
        ]
    };

    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetDealerRepCodeRegister"
    };
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/masterrepcode/list', dataarticle, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 
        //   console.log(response);
          res.json(response.data);
        })
        .catch(error => res.send(JSON.stringify(error)))
}

exports.salestargetmonthly = function (req, res) {
    var resJ=[];
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardSalesTarget"
    };
    
    var postData = JSON.parse(JSON.stringify(req.body));

    var companycode =postData.CompanyCode;
    var inputbulan = postData.PeriodMonth;
    var inputtahun = postData.PeriodYear;


    var bulan = postData.PeriodMonth;
    var tahun = postData.PeriodYear;

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
    let diff = toDate.diff(fromDate, type);

    console.log(diff);

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
 
    const data =
    {
        "CompanyCode":postData.CompanyCode,
        "PeriodYear":postData.PeriodYear,
        "PeriodMonth":postData.PeriodMonth,
        "WorkingDays":postData.WorkingDays,
        "UserInfo":[
          {
           "LoginID":"DCBAPI001",
           "Password":"password.123"
          }
        ]
    };
        
    
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsalestarget/list', data, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 

        var newdata = [];
        let countdata;
        var PeriodYear = 0;
        var CompanyName = 0;
        var CompanyCode = 0;
        var PeriodYear = 0;
        var PeriodMonth = 0;
        var AmountTarget = 0;

        response.data.GetSparepartControlBoardSalesTargetResult.forEach((drow) => {

          CompanyCode = drow.CompanyCode;
          CompanyName = drow.CompanyName;
          PeriodYear = drow.PeriodYear,
          PeriodMonth = drow.PeriodMonth,
          AmountTarget = drow.AmountTarget
           
        });
       
        connection.query('SELECT COUNT(*) FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [companycode, inputbulan,inputtahun], (error, result) => {
          if (error) {
            console.error(error);
          } else {
            countdata = result.rows[0].count;
            // console.log(total_workingdays);
            var allworkingdays = (parseInt(total_workingdays));
            // console.log(countdata); 
            if(countdata > 0){
            var allworkingdays = (parseInt(total_workingdays) - parseInt(countdata));
            }

            newdata.push({"CompanyCode":CompanyCode,"CompanyName":CompanyName,"PeriodYear":PeriodYear,"PeriodMonth":PeriodMonth,"AmountTarget":AmountTarget,"Workingdays":allworkingdays});
            
            res.json(newdata);
          }
        });

        })
        .catch(error => res.send(JSON.stringify(error)))

}

exports.salestargetyearly = function (req, res) {
    var resJ=[];
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    
    var postData = JSON.parse(JSON.stringify(req.body));;
    // POST request using axios with set headers
    const data =
    {
        "CompanyCode":postData.CompanyCode,
        "PeriodYear":postData.PeriodYear,
        "Semester":postData.Semester,
        "UserInfo":[
          {
           "LoginID":"DCBAPI001",
           "Password":"password.123"
          }
        ]
    };
        
    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardSalesTargetYearly"
    };
    
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsalestargetyearly/list', data, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 
        //   console.log(response);

        res.json(response.data);
        //   res.json(response.data['GetSalesOrderInvoiceSummaryRegisterResult']);
          console.log(response.data);
        })
        .catch(error => res.send(JSON.stringify(error)))
}

exports.movingcode = function (req, res) {
    var resJ=[];
    //res.send(req.body.phone+'post'+req.params.phone)
     // At request level
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    
    var postData = JSON.parse(JSON.stringify(req.body));;
    // POST request using axios with set headers
    const data =
    {
        "CompanyCode":postData.CompanyCode,
        "PeriodYear":postData.PeriodYear,
        "PeriodMonth":postData.PeriodMonth,
        "MovingCode":postData.MovingCode,
        "UserInfo":[
          {
           "LoginID":"DCBAPI001",
           "Password":"password.123"
          }
        ]
    };
        
    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardMovingCode"
    };
    
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardmovingcode/list', data, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 
  
        res.json(response.data);
        //   res.json(response.data['GetSalesOrderInvoiceSummaryRegisterResult']);
          console.log(response.data);
        })
        .catch(error => res.send(JSON.stringify(error)))
}

exports.transtype = function (req, res) {
    var resJ=[];
     const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    
    var postData = JSON.parse(JSON.stringify(req.body));;
    // POST request using axios with set headers
    const data =
    {
        "CompanyCode":postData.CompanyCode,
        "MonthPeriod":postData.MonthPeriod,
        "UserInfo":[
          {
           "LoginID":"DCBAPI001",
           "Password":"password.123"
          }
        ]
    };
        
    const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardByTransType"
    };
    
    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardtranssummary/list', data, { headers , httpsAgent: agent  })
        .then(async(response) =>{ 
    
        res.json(response.data);

        })
        .catch(error => res.send(JSON.stringify(error)))
}

exports.sparepartdailydetail = function (req, res) {

  var resJ=[];
  const agent = new https.Agent({  
  rejectUnauthorized: false
  });

  const headers = { 
    "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
    "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
    "Content-Type": "application/json",
    "ID": "hmsi",
    "Pwd": "hmsi:hmsipassword123",
    "ProcFlag": "GetSparepartControlBoardDetail"
  };
  
  var postData = JSON.parse(JSON.stringify(req.body));
  var CompanyCode = postData.CompanyCode;
  var bulan = postData.PeriodMonth;
  var tahun = postData.PeriodYear;

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
      var start_date = `'${tahun}-${bulan}-01'`
      var end_date = `'${tahunplus}-${bulanplus}-01'`
      var type = "days"
    }else{
      var start_date = `'${tahun}-${bulan}-01'`
      var end_date = `'${tahun}-${bulanplus}-01'`
      var type = "days"
    }
    
    // let compareStartDate = moment(leaveStartDate).isAfter(leaveMetaStartDate);
    moment.suppressDeprecationWarnings = true;
    let fromDate = moment(start_date);
    // console.log(fromDate );
    let toDate = moment(end_date);
    // console.log(toDate );
    let diff = toDate.diff(fromDate, type)+1;

    // console.log(diff);
    
    const rangedate = [];
    for (let i = 0 ; i < diff; i++) {

    var new_date = moment(start_date, "YYYY-MM-DD").add('days', i);

    rangedate.push(new_date);

    }
      const requests = rangedate.map((i) => {  

        var day = i.format('DD');
        var month = i.format('MM');
        var year = i.format('YYYY');
        var new_tanggal = (year + '-' + month + '-' + day);

        const databody =
        {
            "CompanyCode":postData.CompanyCode,
            "DatePeriod":new_tanggal,
            "UserInfo":[
              {
              "LoginID":"DCBAPI001",
              "Password":"password.123"
              }
            ]
        };

        return axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list', databody, { headers , httpsAgent: agent  })
        });
      
      axios.all(requests).then((responses) => {

        console.log("Cek Responses",responses);
        const databaru = [];
        const MaxAkumulasi = [];
        const AverageTarget = postData.AverageTarget;
        var dataamount = [];
        var x = 1;
     
        responses.forEach((resp) => {

          var detail =  resp.data.GetSparepartControlBoardDetailResult;

          var Hari = 0;
          var total = 0;
          var total1 = 0;
          var total2 = 0;
          var total3 = 0;
         
          var Balance = 0;
          var CompanyCode = "";
          var CompanyName = "";
          var DatePeriode = "";

          detail.forEach((drow) => {
            
            CompanyCode = drow.CompanyCode;
            CompanyName = drow.CompanyName;
            DatePeriode = drow.DatePeriode;
            total += parseFloat(drow.TotalAmount);
            total1 = parseFloat(total/100000);
            total2 = Math.floor(total1);
            total3 = parseInt(total2);
           
          });

          dataamount.push(total3);

          if(total3 != 0){
            Hari = x++;
          }else{
            Hari = 0;
          }

          let numbers = dataamount;
          const Akumulasi = numbers.reduce((a, b) => a + b);

          MaxAkumulasi.push(Akumulasi);
          const maxNumber = Math.max(Akumulasi);
          // console.log(maxNumber);
          Balance = Akumulasi-(AverageTarget * Hari);
          
          databaru.push({"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total3,"Akumulasi":Akumulasi,"Balance":Balance});

          // Parse date string to moment object

          // Format moment object to date string in YYYY-MM-DD format
          if(DatePeriode != ""){
          
            connection.query('INSERT INTO daily_detail (hari, companycode, companyname, dateperiode, amount, akumulasi, balance) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT ON CONSTRAINT daily_detail_companycode_dateperiode_key DO UPDATE SET hari = $1, companycode = $2, companyname = $3, dateperiode = $4, amount = $5, akumulasi = $6, balance = $7',
              [Hari,CompanyCode,CompanyName ,DatePeriode,total3,Akumulasi,Balance],
              (error) => {
                if (error) {
                  console.log(error)
                }
                console.log('Data has been inserted or updated.');
              
              }
            );
          }

          });

          const maxNumber = Math.max(...MaxAkumulasi);

          bulan = postData.PeriodMonth;
          tahun = postData.PeriodYear;
          console.log(bulan );
          console.log(tahun );
          console.log(CompanyCode );
          connection.query('INSERT INTO daily_akumulasi (companycode, bulan, tahun, akumulasi) VALUES ($1, $2, $3, $4) ON CONFLICT ON CONSTRAINT daily_akumulasi_unique_companycode_bulan_tahun DO UPDATE SET companycode = $1 , bulan = $2, tahun = $3, akumulasi = $4',
          [CompanyCode,bulan,tahun,maxNumber],
          (error) => {
            if (error) {
              console.log(error)
            }
            console.log('Data has been inserted or updated.');
          
          }
        );

          var arrayToString = JSON.stringify(databaru); // array ubah ke string
         
          const companycode = `${postData.CompanyCode}`;
          const daily = `${arrayToString}`;


          const sum = [{"TotalAkumulasi" : maxNumber ,"Daily" : databaru}]

          res.json(sum);
    
      })
      .catch((error =>{ res.send(JSON.stringify(error));
                        console.log(error);}));
}

exports.holiday = async (req, res) => {
  var crudType = req.headers.crudtype;
     try {
            var Companycode =req.body.CompanyCode;
            var Description = req.body.Description;
            var Holidays_date = req.body.Holidays_date;
            var Active = req.body.Active;
    
            if (crudType == "insert") {
                var text = 'INSERT INTO holidays(companycode,description,holidays_date,active)	VALUES ($1, $2, $3, $4) RETURNING *'
                var value =  [Companycode,Description,Holidays_date,Active];
            } 
            else if (crudType == "update" )
            {
                var text = 'UPDATE holidays set companycode = $1, description = $2, active = $4 Where holidays_date = $3'
                var value =  [Companycode,Description,Holidays_date,Active];
            }
            else if (crudType == "delete" )
            {
                var text = 'DELETE FROM holidays WHERE holidays_date = $1'
                var value = [Holidays_date];
            }
            else {
                var text = 'EXIT'
                var value =  [Holidays_date];
            }
            
            try {
                if (text !== "EXIT") {
                    const resCrud = await connection.query(text, value);
            
                    response.ok("Operation succesfull!", res);
                } else {
                    var FailRes = {};                
                    FailRes["Message"] ='Not known CRUD Type!';
                    response.failed(FailRes, res);
                }
                
            } catch (err) {
                var FailRes = {};
                
                FailRes["Message"] =err.message;
                response.failed(FailRes, res);
                console.log(err.stack);
            }
        } catch (err) {
            console.error(err.message);
        }
};

exports.dailydetail = async (req, res) => {

  var Companycode =req.body.CompanyCode;
  var bulan = req.body.PeriodMonth;
  var tahun = req.body.PeriodYear;

  try {
          const allconfig = await connection.query(`select * from daily_detail where companycode='${Companycode}' AND EXTRACT(MONTH FROM dateperiode) = '${bulan}' AND EXTRACT(YEAR FROM dateperiode) = '${tahun}' order by dateperiode ASC`);
          res.json(allconfig.rows);
      } catch (err) {
          console.error(err.message);
      }   
};

exports.dailyakumulasi = async (req, res) => {

  var Companycode =req.body.CompanyCode;
  var bulan = req.body.PeriodMonth;
  var tahun = req.body.PeriodYear;

  try {
          const allconfig = await connection.query(`select * from daily_akumulasi where companycode='${Companycode}' and tahun ='${tahun}' and bulan='${bulan}' order by bulan ASC`);
          res.json(allconfig.rows);
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
  const { active } = req.body;

  const fileType = mime.getType(originalname);
  // console.log(fileType.startsWith('video'))
  if (!fileType || !fileType.startsWith('video')) {
    res.status(400).json({ message: 'Invalid file type. Only videos are allowed.' });
    return;
  }
  // Generate unique filename with timestamp and original name
  const timestamp = Date.now();
  const filename = `${timestamp}-${originalname}`;

  // Construct the file path
  const filePath = path.join('uploads', filename);
  // Simpan informasi video ke database
  connection.query('INSERT INTO videos (companycode,description,path,active) VALUES ($1, $2, $3, $4)', [companycode,description,filePath,active], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      // Move the uploaded file to the desired location
      fs.renameSync(req.file.path, filePath);
      res.json({ message: 'Video uploaded successfully' });
    }
  });

};

exports.get_video = async (req, res) => {
  const { companycode } = req.params;
  const { all } = "all";

  // Retrieve videos from the database based on companycode
  connection.query('SELECT * FROM videos WHERE companycode = $1 OR companycode = $2', [companycode,all], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      if (results.rows.length === 0) {
        res.status(404).json({ message: 'No videos found for the specified companycode' });
      } else {
        const videos = results.rows;
        res.json(videos);
      }
    }
  });
}

exports.all_video = async (req, res) => {
  // Ambil informasi video dari database
  connection.query('SELECT * FROM public.videos ORDER BY id ASC', (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      if (results.rows.length === 0) {
        res.status(404).json({ message: 'Video not found' });
      } else {
        const videos = results.rows;
        res.json(videos);
      }
    }
  });
};

exports.videodelete = async (req, res) => {

  const videoId = req.params.id;

  // Mengambil informasi path file video dari database
  connection.query('SELECT path FROM videos WHERE id = $1', [videoId], (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    if (results.rows.length === 0) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    const videoPath = results.rows[0].path;

    // Menghapus data video dari database
    connection.query('DELETE FROM videos WHERE id = $1', [videoId], (deleteError) => {
      if (deleteError) {
        console.error(deleteError);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      // Menghapus file video dari folder "uploads"
      fs.unlink(videoPath, (unlinkError) => {
        if (unlinkError) {
          console.error(unlinkError);
          res.status(500).json({ message: 'Internal server error' });
          return;
        }

        res.json({ message: 'Video deleted successfully' });
      });
    });
  });
};