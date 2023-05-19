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
const Crontask = cron.schedule('*/5 * * * * ', async (req, res) => {

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
    
    // console.log(dataArray);
    const headers = { 
        "Access-Control-Allow-Headers": "*", // this will allow all CORS requests
        "Access-Control-Allow-Methods": 'OPTIONS,POST,GET', // this states the allowed methods
        "Content-Type": "application/json",
        "ID": "hmsi",
        "Pwd": "hmsi:hmsipassword123",
        "ProcFlag": "GetSparepartControlBoardDetail"
      };
      
  const companyCodes = ["106070000"];
//   const companyCodes = dataArray1;
  const currentDate = new Date();
  const currentMonth = "05"; // Bulan dimulai dari 0, maka ditambah 1
  const currentYear = "2023";

  // Lakukan tugas cron untuk setiap parameter
  companyCodes.forEach(async companyCode => {

    var average = 0;
    try {
        const result = await query(`SELECT averagetarget FROM monthly_target WHERE companycode = '${companyCode}' AND tahun = '${currentYear}' AND bulan = '${currentMonth}' ORDER BY bulan ASC`);
       
        result.rows.forEach(row => {
            const inputDate = row.averagetarget;
            average = inputDate;
        });
                         
      } catch (err) {
        average = 0;
      }
    
            var CompanyCode = companyCode;
            var inputbulan = currentMonth;
            var inputtahun = currentYear;
            var new_tanggal;

            const dataArray = [];
          
            try {
              const result = await query('SELECT holidays_date, description FROM holidays WHERE companycode = $1 AND EXTRACT(MONTH FROM holidays_date) = $2 AND EXTRACT(YEAR FROM holidays_date) = $3', [CompanyCode, inputbulan, inputtahun]);
            
              result.rows.forEach(row => {
                const inputDate = row.holidays_date;
                const formattedDate = moment(inputDate).add('day').format('YYYY-MM-DD');
                const description = row.description;
                const data = { date: formattedDate, description: description };
                dataArray.push(data);
              });
            } catch (error) {
              console.error('Error querying database:', error);
            }

            var bulan = currentMonth;
            var tahun = currentYear;
          
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
              
              moment.suppressDeprecationWarnings = true;
              let fromDate = moment(start_date);
            //   console.log(fromDate);
              let toDate = moment(end_date);
            //   console.log(toDate);
              let diff = toDate.diff(fromDate, type);
            //   console.log(diff);
          
              const rangedate = [];
            //   for (let i = 0 ; i < diff; i++) {
                for (let i = 0 ; i < 14; i++) {
          
              var new_date = moment(start_date, "YYYY-MM-DD").add('days', i);
              rangedate.push(new_date);
          
              }
            //   console.log(rangedate);
                const requests = rangedate.map((i) => {  
          
                  var day = i.format('DD');
                  var month = i.format('MM');
                  var year = i.format('YYYY');
                  new_tanggal = (year + '-' + month + '-' + day);
                    
                  var resJ=[];
                  const agent = new https.Agent({  
                  rejectUnauthorized: false
                  });

                  const databody =
                  {
                      "CompanyCode":companyCode,
                      "DatePeriod":new_tanggal,
                      "UserInfo":[
                        {
                        "LoginID":"DCBAPI001",
                        "Password":"password.123"
                        }
                      ]
                  };
                //   console.log(databody);
        
                  return axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list', databody, { timeout: 300000,headers , httpsAgent: agent  })
                  });
                
                axios.all(requests).then((responses) => {

                  const databaru = [];
                  const MaxAkumulasi = [];
                  const AverageTarget = average;
                  var dataamount = [];
                  var x = 1;
                  var y = 1;
                  
                  responses.forEach((resp) => {
                    
                    var new_tanggal = resp.config.data; // Access DatePeriod
                    var jsonString = new_tanggal;
                    var jsonObject = JSON.parse(jsonString);
                   
                    var detail =  resp.data.GetSparepartControlBoardDetailResult;
                    var Hari = 0;
                    var total = 0;
                    var total1 = 0;
                    var total2 = 0;
                    var total3 = 0;
                    var Balance = 0;
                    var CompanyCode = companyCode;
                    var CompanyName = "";
                    var DatePeriode = jsonObject.DatePeriod;
                    // console.log(DatePeriode);
                    
                    if(detail){
                    detail.forEach((drow) => {
                      
                      CompanyCode = drow.CompanyCode;
                      CompanyName = drow.CompanyName;
                      DatePeriode = drow.DatePeriode;
                      total += parseFloat(drow.TotalAmount);
                      total1 = parseFloat(total/100000);
                      total2 = Math.floor(total1);
                      total3 = parseInt(total2);
                     
                    });
                    }
          
                    dataamount.push(total3);
          
                    if(total3 != 0){
                      Hari = x++;
                    }else{
                      Hari = 0;
                    }
                    var tanggal = y++
          
                    let numbers = dataamount;
                    var Akumulasi = numbers.reduce((a, b) => a + b);
          
                    MaxAkumulasi.push(Akumulasi);
                    const maxNumber = Math.max(Akumulasi);
                   
                    Balance = Akumulasi-(AverageTarget * Hari);
          
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
                    
                      dataArray.forEach(element => {
                        if(element.date == DatePeriode ){
                          isHoliday = true;
                        }
                      });
                    } 
                    
                      if(total3 == 0){
                        Akumulasi = 0;
                        Balance = 0;
                        databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total3,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
                      }else{
                        databaru.push({"Tanggalke" : tanggal,"Hari" : Hari,"CompanyCode":CompanyCode,"CompanyName":CompanyName,"DatePeriode":DatePeriode,"Amount":total3,"Akumulasi":Akumulasi,"Balance":Balance ,"isHoliday" : isHoliday});
                      }
          
                      if(DatePeriode != ""){
                    
                        connection.query('INSERT INTO daily_detail (tanggalke, hari, companycode, companyname, dateperiode, amount, akumulasi, balance, isholiday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ON CONSTRAINT daily_detail_companycode_dateperiode_key DO UPDATE SET tanggalke= $1, hari = $2, companycode = $3, companyname = $4, dateperiode = $5, amount = $6, akumulasi = $7, balance = $8',
                          [tanggal,Hari,CompanyCode,CompanyName ,DatePeriode,total3,Akumulasi,Balance,isHoliday],
                          (error) => {
                            if (error) {
                              console.log(error)
                            }
                            console.log(`Data has been inserted or updated daily detail ${CompanyCode} tanggal ke ${tanggal} dan ${average}`);
                          }
                        );
                      }
                     
                    });
          
                    const maxNumber = Math.max(...MaxAkumulasi);
          
                    bulan = currentMonth;
                    tahun = currentYear;
          
                    connection.query('INSERT INTO daily_akumulasi (companycode, bulan, tahun, akumulasi) VALUES ($1, $2, $3, $4) ON CONFLICT ON CONSTRAINT daily_akumulasi_unique_companycode_bulan_tahun DO UPDATE SET companycode = $1 , bulan = $2, tahun = $3, akumulasi = $4',
                    [CompanyCode,bulan,tahun,maxNumber],
                    (error) => {
                      if (error) {
                        console.log(error)
                      }
                      console.log(`data has been inserted or updated daily akumulasi ${CompanyCode}`);
                    
                    }
                    );
          
                    const sum = [{"TotalAkumulasi" : maxNumber ,"Daily" : databaru}]
                })
                .catch();
  });
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

// Export tugas cron
module.exports = Crontask;