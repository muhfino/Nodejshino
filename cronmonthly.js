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
const cron = require('node-cron');
const { error } = require('console');

// const cronTask = cron.schedule('0 12,0 * * *', () => {
const Crontask1 = cron.schedule('*/3 * * * *', async (req, res) => {

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

   const dataArray1 = [];

   try {
   const result = await query('SELECT companycode FROM public.company ORDER BY id ASC');
   
   result.rows.forEach(row => {
       const companyCode = row.companycode;
       dataArray1.push(companyCode);
   });
   } catch (error) {
   console.error('Error querying database:', error);
   }

//    console.log(dataArray1);

//    var postData = JSON.parse(JSON.stringify(req.body));
   const currentDate = new Date();
//    var companycodes =CompanyCode;
    const companyCodes = dataArray1;
   var inputbulan = "05";
   var inputtahun = currentDate.getFullYear();
   var bulan = "05";
   var tahun = currentDate.getFullYear();
     
   companyCodes.forEach(async CompanyCode1 => {

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
//    console.log(diff);
 
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
       "CompanyCode":CompanyCode1,
       "PeriodYear":currentDate.getFullYear(),
       "PeriodMonth":"05",
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
       var CompanyName = 0;
       var CompanyCode = CompanyCode1;
       var PeriodYear = tahun;
       var PeriodMonth = bulan;
       var AmountTarget = 0;
       var AmountTarget1 = 0;
       var AmountTarget2 = 0;
       var AmountTarget3 = 0;

       if(response.data.GetSparepartControlBoardSalesTargetResult){
 
            response.data.GetSparepartControlBoardSalesTargetResult.forEach((drow) => {
        
                CompanyCode1 = drow.CompanyCode;
                CompanyName = drow.CompanyName;
                PeriodYear = drow.PeriodYear,
                PeriodMonth = drow.PeriodMonth,
                AmountTarget = drow.AmountTarget
                
            });
        }
      
       connection.query('SELECT holidays_date , description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [CompanyCode, inputbulan, inputtahun], (error, result) => {
         if (error) {
           console.error(error);
         } else {
 
           var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
           const dataArray = [];
 
           result.rows.forEach(row => {
 
             const inputDate = row.holidays_date;
             var new_date = moment(inputDate).add('day').format('YYYY-MM-DD');
             var date = new Date(new_date);
             var thisDay = date.getDay();
             thisDay = myDays[thisDay];
             if(thisDay != "Minggu"){
               dataArray.push(thisDay);
             }
               
             });   
             const count = dataArray.length;
 
             var allworkingdays = (parseInt(total_workingdays));
         
             if(count > 0){
             var allworkingdays = (parseInt(total_workingdays) - parseInt(count));
             }
 
             if(AmountTarget){
               AmountTarget1 = parseFloat(AmountTarget/100000);
               AmountTarget2 = Math.floor(AmountTarget1);
               AmountTarget3 = parseInt(AmountTarget2);
               var AverageTarget = parseFloat(AmountTarget2/allworkingdays);
               AverageTarget = Math.floor(AverageTarget);
             }
 
             console.log("Jumlah Hari dalam 1 bulan = ",diff);
             console.log("Jumlah Hari Minggu = ",minggu);
             console.log("Jumlah Hari Holiday = ",count);
             console.log("Jumlah total Workingday",allworkingdays);
 
             newdata.push({"CompanyCode":CompanyCode1,"CompanyName":CompanyName,"PeriodYear":PeriodYear,"PeriodMonth":PeriodMonth,"AmountTarget":AmountTarget3,"Workingdays":allworkingdays ,"Average" : AverageTarget});
             
             connection.query('INSERT INTO monthly_target (companycode, bulan, tahun, amounttarget ,workingdays,averagetarget) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ON CONSTRAINT monthly_target_unique_companycode_bulan_tahun DO UPDATE SET companycode = $1 , bulan = $2, tahun = $3, amounttarget = $4 ,workingdays= $5 ,averagetarget =$6',
             [CompanyCode1,PeriodMonth,PeriodYear,AmountTarget3,allworkingdays,AverageTarget],
             (error) => {
               if (error) {
                 console.log(error)
               }
               console.log(`data masuk ke database ${CompanyCode1}`);
             
             }
             );
         }
       });
 
       })
       .catch(error)
    });
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

module.exports = Crontask1;