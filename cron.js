const cron = require('node-cron');
const axios = require('axios');

// Definisikan cron job untuk menjalankan hit API pada jadwal yang ditentukan
cron.schedule('0 12 * * *', async (req,res) => {
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
            // console.log(formattedDate);
            // ON CONFLICT ($4) DO UPDATE SET hari = $1, companycode = $2, companyname = $3, amount = $5, akumulasi = $6,  balance = $7
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
  
            // console.log(databaru);
  
            var arrayToString = JSON.stringify(databaru); // array ubah ke string
           
            const companycode = `${postData.CompanyCode}`;
            const daily = `${arrayToString}`;
  
  
            const sum = [{"TotalAkumulasi" : maxNumber ,"Daily" : databaru}]
  
           
  
            res.json(sum);
      
        })
        .catch((error =>{ res.send(JSON.stringify(error));
                          console.log(error);}));
});

// Tambahkan cron job kedua untuk dijalankan pada pukul 12 malam
cron.schedule('0 0 * * *', async (req,res) => {
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
            // console.log(formattedDate);
            // ON CONFLICT ($4) DO UPDATE SET hari = $1, companycode = $2, companyname = $3, amount = $5, akumulasi = $6,  balance = $7
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
  
            // console.log(databaru);
  
            var arrayToString = JSON.stringify(databaru); // array ubah ke string
           
            const companycode = `${postData.CompanyCode}`;
            const daily = `${arrayToString}`;
  
  
            const sum = [{"TotalAkumulasi" : maxNumber ,"Daily" : databaru}]
  
           
  
            res.json(sum);
      
        })
        .catch((error =>{ res.send(JSON.stringify(error));
                          console.log(error);}));
});

module.exports = cron;