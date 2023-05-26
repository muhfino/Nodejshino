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

// Definisikan tugas cron


// const cronTask = cron.schedule('0 12,0 * * *', () => {
const Crontask = cron.schedule('*/2 * * * * ', async (req, res) => {

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
    
  const headers = { 
      "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
      "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
      "Content-Type": "application/json",
      "ID": "hmsi",
      "Pwd": "hmsi:hmsipassword123",
      "ProcFlag": "GetSparepartControlBoardDetail"
  };

  const datatukday = "10";
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentDay = datatukday;
  const formattedDate = `${currentYear}-${currentMonth}-${currentDay}`;
  const companyCodes = dataArray1;
 

  // Lakukan tugas cron untuk setiap parameter
  companyCodes.forEach(async companycode1 => {

    // var postData = JSON.parse(JSON.stringify(req.body));
    var companycode = companycode1;
    var inputbulan = currentMonth;
    var inputtahun = currentYear;
    var inputday = currentDay;
    var formattedDay = parseInt(inputday, 10);
    var dataamount = [];
    var MaxAkumulasi = [];
    var databaru = [];
    var dailydetailnew;
    var bulan = currentMonth;
    var tahun = currentYear;
    var y;
    var new_tanggal = `${inputtahun}-${inputbulan}-${inputday}`
    // console.log(new_tanggal);
  
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
  
    var AverageTarget;
    
    try {
  
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
    
      const data = {
        "CompanyCode": companycode,
        "PeriodYear": inputtahun,
        "PeriodMonth": inputbulan,
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
      
        const result = await connection.query('SELECT holidays_date, description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [companycode, inputbulan, inputtahun]);
      
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
        var AmountTargetMon = 0;
        if(response.data.GetSparepartControlBoardSalesTargetResult){
          response.data.GetSparepartControlBoardSalesTargetResult.forEach((drow) => {
            AmountTargetMon = drow.AmountTarget;
          });
        }
  
        if (AmountTargetMon) {
          AmountTargetMon = parseFloat(AmountTargetMon) / 100000; // Ubah ke float sebelum membagi
          AmountTargetMon = Math.round(AmountTargetMon);
          AmountTargetMon = parseInt(AmountTargetMon);
          AverageTarget = parseFloat(AmountTargetMon) / allworkingdays; // Ubah ke float sebelum membagi
          AverageTarget = Math.round(AverageTarget);
        }
      
        } catch (error) {
          console.log(error)
        }
  
      } catch (error) {
        console.log(error)
      }
  
    var maxhari;
    var maxamount;
    var arrayAmount = [];
    try {
      const query = `SELECT hari, amount,tanggalke FROM daily_detail WHERE companycode = $1 AND TO_CHAR(dateperiode::date, 'MM') = $2 AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 ORDER BY dateperiode ASC`;
      const values = [companycode, inputbulan, inputtahun];
    
      const result = await connection.query(query, values);
      var lasthari = 0;
      var arrayLastHari = [];
      
    
      result.rows.forEach(row => {
        if(row.tanggalke < formattedDay){
        lasthari = row.hari;
        arrayLastHari.push(lasthari);
    
        var amount = row.amount;
        arrayAmount.push(parseInt(amount));
        }
      });
    
      maxhari = Math.max(...arrayLastHari);
    
    } catch (err) {
      console.error(err.message);
    }
  
    const DetailAllholiday = [];
              
    try {
        const result = await query('SELECT holidays_date, description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [companycode, inputbulan, inputtahun]);
    
        result.rows.forEach(row => {
        const inputDate = row.holidays_date;
        const formattedDate = moment(inputDate).add('day').format('YYYY-MM-DD');
        const description = row.description;
        const data = { date: formattedDate, description: description };
        DetailAllholiday.push(data);
        });
  
    } catch (error) {
        console.error('Error querying database:', error);
    }
    
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
      var Balance;
    
      if(respondetail){
        respondetail.forEach((drow) => {
            companycode = drow.CompanyCode;
            companyname = drow.CompanyName;
            datePeriode = drow.DatePeriode;
            total1 += parseFloat(drow.TotalAmount);
            total = parseFloat(total1/100000);
            total = Math.round(total);
            total = parseInt(total);
        });
      }
  
      arrayAmount.push(total);
  
      var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
      if(datePeriode != ""){
          const inputDate = datePeriode;
          var new_date = moment(inputDate).add('day').format('YYYY-MM-DD');
          var date = new Date(new_date);
          var thisDay = date.getDay();
          thisDay = myDays[thisDay];
  
          if(thisDay == "Minggu"){
            var isHoliday = true;
          }else{
            var isHoliday = false;
          }
          
          DetailAllholiday.forEach(element => {
            if(element.date == datePeriode ){
              isHoliday = true;
            }
          });
        } 
        var x = 0;
        var Hari = 0;
        if(total != 0){
            
            if(isHoliday == true){
              Hari = 0;
            }else{
              Hari = parseInt(maxhari) + parseInt(1);
            }
        }else{
  
          if(isHoliday == true){
          Hari = 0;
          }
  
          if(isHoliday == false){
            Hari = parseInt(maxhari) + parseInt(1);
          }
  
        }
  
        let numbers = arrayAmount;
        var Akumulasi = numbers.reduce((a, b) => a + b);
        
        Balance = Akumulasi-(AverageTarget * Hari);
      
        var myDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
          if(total == 0){
            Akumulasi = 0;
            Balance = 0;
            databaru.push({"Tanggalke" : formattedDay,"Hari" : Hari,"CompanyCode":companycode,"CompanyName":companyname,"DatePeriode":datePeriode,"Amount":total,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
          }else{
            databaru.push({"Tanggalke" : formattedDay,"Hari" : Hari,"CompanyCode":companycode,"CompanyName":companyname,"DatePeriode":datePeriode,"Amount":total,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
          }
          console.log(total);
          if(datePeriode != ""){
            
            connection.query('INSERT INTO daily_detail (tanggalke, hari, companycode, companyname, dateperiode, amount, akumulasi, balance, isholiday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ON CONSTRAINT daily_detail_companycode_dateperiode_key DO UPDATE SET amount = $6 ,akumulasi = $7 ,balance =$8',
              [formattedDay,Hari,companycode,companyname ,datePeriode,total,Akumulasi,Balance,isHoliday],
              (error) => {
                if (error) {
                  console.log(error)
                }
                console.log(`Data has been inserted or updated.${companycode} no ${datatukday}`);
              }
            );
          }
  
    } catch (error) {
     console.log(error);
    }
  
  });


}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

// Export tugas cron
module.exports = Crontask;