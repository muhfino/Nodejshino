const axios = require('axios');
const cron = require('node-cron');
var connection = require('./db');
const https = require('https');

// Definisikan tugas cron

// const Crontask = cron.schedule('0 1,12,16 * * *', async (req, res) => {
const Crontask = cron.schedule('*/2 * * * *', async (req, res) => {

    const allCompany = [];

    try {
    const result = await connection.query('SELECT companycode FROM public.company ORDER BY id ASC');
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
                total = Math.round(total);
                total = parseInt(total);
            });
        }
        
        connection.query('INSERT INTO daily (tanggal, companycode, companyname, dateperiode, amount) VALUES ($1, $2, $3, $4, $5) ON CONFLICT ON CONSTRAINT daily_companycode_dateperiode_key DO UPDATE SET amount = $5',
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
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});

Crontask.start();

module.exports = Crontask;