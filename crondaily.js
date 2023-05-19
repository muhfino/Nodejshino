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
const Crontask = cron.schedule('*/3 * * * *', async (req, res) => {

    const dataArray1 = [];

    try {
    const result = await query('SELECT companycode FROM public.company ORDER BY id ASC');
    
    result.rows.forEach(row => {
        const companyCode = row.companycode;
        dataArray1.push(companyCode);
    });
    console.log("cek company sukses");
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

  const datatukday = ["01","02","03","04","05","06","07","08","09","11","12"]
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentDay = datatukday;
  const formattedDate = `${currentYear}-${currentMonth}-${currentDay}`;

  const companyCodes = dataArray1;
  var last_data;

  // Lakukan tugas cron untuk setiap parameter
  companyCodes.forEach(async companyCode1 => {
    currentDay.forEach(async day => {

    var CompanyCode = companyCode1;
    var inputbulan = currentMonth;
    var inputtahun = currentYear;
    var inputtanggal = day;
    var dataamount = [];
    var datahari = [];
  
    var last_amount;
    var ini_hari;
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
        // console.log("cek holiday sukses");
      });
    } catch (error) {
      console.error('Error querying database:', error);
      
    }
  
    try {
  
      const query = `
        SELECT * 
        FROM daily_detail 
        WHERE companycode = $1 
          AND TO_CHAR(dateperiode::date, 'MM') = $2 
          AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 
        ORDER BY dateperiode ASC
      `;
      const values = [CompanyCode, inputbulan, inputtahun];
  
      const result = await connection.query(query, values);
  
      last_data = result.rows;
      // console.log("cek dailydetail sukses");
      } catch (err) {
      console.error(err.message);
      }
  
      try {
    
        const query = `
          SELECT amount 
          FROM daily_detail 
          WHERE companycode = $1 
            AND TO_CHAR(dateperiode::date, 'MM') = $2 
            AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 
          ORDER BY dateperiode ASC
        `;
        const values = [CompanyCode, inputbulan, inputtahun];
    
        const result = await connection.query(query, values);
    
       
        result.rows.forEach(row => {
          last_amount = row.amount;
          var AA = last_amount;
          var BB = JSON.parse(AA);
          dataamount.push(BB)
        });
        // console.log("cek holiday sukses");
  
        } catch (err) {
        console.error(err.message);
        // res.status(500).json({ error: err.message });
        }
  
        try {
      
          const query = `
            SELECT hari 
            FROM daily_detail 
            WHERE companycode = $1 
              AND TO_CHAR(dateperiode::date, 'MM') = $2 
              AND EXTRACT(YEAR FROM dateperiode::date)::text = $3 
            ORDER BY dateperiode ASC
          `;
          const values = [CompanyCode, inputbulan, inputtahun];
      
          const result = await connection.query(query, values);
      
          result.rows.forEach(row => {
            ini_hari = row.hari;
            var AA = ini_hari;
            var BB = JSON.parse(AA);
            datahari.push(BB)
          });
    
          } catch (err) {
          console.error(err.message);
          // res.status(500).json({ error: err.message });
          }
  
      var average = 0;
      try {
          const result = await query(`SELECT averagetarget FROM monthly_target WHERE companycode = '${CompanyCode}' AND tahun = '${inputtahun}' AND bulan = '${inputbulan}' ORDER BY bulan ASC`);
         
          result.rows.forEach(row => {
              const inputDate = row.averagetarget;
              average = inputDate;
          });
                           
        } catch (err) {
          average = 0;
        }

      var day = inputtanggal;
      var month = inputbulan;
      var year = inputtahun;
      new_tanggal = (year + '-' + month + '-' + day);
      
      try {
        const databody = {
          "CompanyCode": companyCode1,
          "DatePeriod": new_tanggal,
          "UserInfo": [
            {
              "LoginID":"DCBAPI001",
              "Password":"password.123"
            }
          ]
        };
      
        const agent = new https.Agent({
          rejectUnauthorized: false, // Hanya gunakan jika Anda menghadapi masalah sertifikat
        });
      
        const response = await axios.post(
          'https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboarddetail/list',
          databody,
          {
            headers: headers,
            httpsAgent: agent
          }
        );
          
        var new_tanggal = response.config.data; // Access DatePeriod
        var jsonString = new_tanggal;
        var jsonObject = JSON.parse(jsonString);
       
        var detail =  response.data.GetSparepartControlBoardDetailResult;
        var Hari = 0;
        var total = 0;
        var total1 = 0;
        var total2 = 0;
        var total3 = 0;
        var Balance = 0;
        var CompanyCode = companyCode1
        var CompanyName = "";
        var DatePeriode = jsonObject.DatePeriod;
      
        var MaxAkumulasi = [];
        var x = 1;
        var y = 1;
        
        if(detail){
  
          detail.forEach((drow) => {
            
            CompanyCode = drow.CompanyCode;
            CompanyName = drow.CompanyName;
            DatePeriode = drow.DatePeriode;
            total += parseFloat(drow.TotalAmount);
            total1 = parseFloat(total/100000);
            total2 = Math.floor(total1);
            total3 = parseInt(total2);
            // console.log(total3);

          });
        }
        
        dataamount.push(total3);

        const numbers1 = datahari;
        const maxNumber = Math.max(...numbers1);
      
        if(total3 != 0){
          Hari = parseInt(maxNumber) + parseInt(1);
        }else{
          Hari = 0;
        }
  
        let numbers = dataamount;
        var Akumulasi = numbers.reduce((a, b) => a + b);
  
        Balance = Akumulasi-(average * Hari);
  
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
        }

          if(DatePeriode != ""){
        
            connection.query('INSERT INTO daily_detail (tanggalke, hari, companycode, companyname, dateperiode, amount, akumulasi, balance, isholiday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ON CONSTRAINT daily_detail_companycode_dateperiode_key DO UPDATE SET tanggalke= $1,companycode = $3, companyname = $4, dateperiode = $5, amount = $6, akumulasi = $7, balance = $8',
              [inputtanggal,Hari,CompanyCode,CompanyName ,DatePeriode,total3,Akumulasi,Balance,isHoliday],
              (error) => {
                if (error) {
                  console.log(error)
                }
                console.log(`Data has been inserted or updated.${CompanyCode}`);
              }
            );
          }
  
          connection.query('INSERT INTO daily_akumulasi (companycode, bulan, tahun, akumulasi) VALUES ($1, $2, $3, $4) ON CONFLICT ON CONSTRAINT daily_akumulasi_unique_companycode_bulan_tahun DO UPDATE SET companycode = $1 , bulan = $2, tahun = $3, akumulasi = $4',
          [CompanyCode,inputbulan,inputtahun,maxNumber],
          (error) => {
            if (error) {
              console.log(error)
            }
            console.log(`data has been inserted or updated daily akumulasi ${CompanyCode}`);
          }
          );
      } catch (error) {
        console.log(`TIDAK DAPAT RESPON ${CompanyCode}`); // Tangani kesalahan jika terjadi
      }
    });
  });
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

// Export tugas cron
module.exports = Crontask;