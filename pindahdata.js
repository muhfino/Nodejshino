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
        var AmountTarget1 = 0;
        var AmountTarget2 = 0;
        var AmountTarget3 = 0;

        response.data.GetSparepartControlBoardSalesTargetResult.forEach((drow) => {

          CompanyCode = drow.CompanyCode;
          CompanyName = drow.CompanyName;
          PeriodYear = drow.PeriodYear,
          PeriodMonth = drow.PeriodMonth,
          AmountTarget = drow.AmountTarget
           
        });
       
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

              newdata.push({"CompanyCode":CompanyCode,"CompanyName":CompanyName,"PeriodYear":PeriodYear,"PeriodMonth":PeriodMonth,"AmountTarget":AmountTarget3,"Workingdays":allworkingdays ,"Average" : AverageTarget});
              
              res.json(newdata);
          }
        });

        })
        .catch(error => res.send(JSON.stringify(error)))

}

exports.salestargetyearly = function (req, res) {
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
      "ProcFlag": "GetSparepartControlBoardSalesTargetYearly"
    };

    const data = {
      "CompanyCode": postData.CompanyCode,
      "PeriodYear": postData.PeriodYear,
      "Semester": postData.Semester,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardsalestargetyearly/list', data, {
      headers,
      httpsAgent: agent
    })
      .then(async (response) => {
        res.json(response.data);
        console.log(response.data);
      })
      .catch(error => res.send(JSON.stringify(error)));
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.movingcode = function (req, res) {
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

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardmovingcode/list', data, {
      headers,
      httpsAgent: agent
    })
      .then(async (response) => {
        res.json(response.data);
        console.log(response.data);
      })
      .catch(error => res.send(JSON.stringify(error)));
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.transtype = function (req, res) {
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
      "ProcFlag": "GetSparepartControlBoardByTransType"
    };

    const data = {
      "CompanyCode": postData.CompanyCode,
      "MonthPeriod": postData.MonthPeriod,
      "UserInfo": [
        {
          "LoginID": "DCBAPI001",
          "Password": "password.123"
        }
      ]
    };

    axios.post('https://hdcs.hinodms.co.id/restapi/frontend/web/index.php/sparepartcontrolboardtranssummary/list', data, {
      headers,
      httpsAgent: agent
    })
      .then(async (response) => {
        res.json(response.data);
      })
      .catch(error => res.send(JSON.stringify(error)));
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.sparepartdailydetail111 =  async (req, res) => {

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
  var inputbulan = postData.PeriodMonth;
  var inputtahun = postData.PeriodYear;
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
    
    moment.suppressDeprecationWarnings = true;
    let fromDate = moment(start_date);
    let toDate = moment(end_date);
    let diff = toDate.diff(fromDate, type);

    const rangedate = [];
    for (let i = 0 ; i < diff; i++) {

    var new_date = moment(start_date, "YYYY-MM-DD").add('days', i);
    rangedate.push(new_date);

    }
      const requests = rangedate.map((i) => {  

        var day = i.format('DD');
        var month = i.format('MM');
        var year = i.format('YYYY');
        new_tanggal = (year + '-' + month + '-' + day);

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

        const databaru = [];
        const MaxAkumulasi = [];
        const AverageTarget = postData.AverageTarget;
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
          var CompanyCode = postData.CompanyCode;
          var CompanyName = "";
          var DatePeriode = jsonObject.DatePeriod;

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
          var tanggal = y++
          // console.log(dataamount);
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
                  console.log('Data has been inserted or updated.');
                }
              );
            }
           
          });

          const maxNumber = Math.max(...MaxAkumulasi);

          console.log(maxNumber);

          bulan = postData.PeriodMonth;
          tahun = postData.PeriodYear;

          connection.query('INSERT INTO daily_akumulasi (companycode, bulan, tahun, akumulasi) VALUES ($1, $2, $3, $4) ON CONFLICT ON CONSTRAINT daily_akumulasi_unique_companycode_bulan_tahun DO UPDATE SET companycode = $1 , bulan = $2, tahun = $3, akumulasi = $4',
          [CompanyCode,bulan,tahun,maxNumber],
          (error) => {
            if (error) {
              console.log(error)
            }
            console.log('Data has been inserted or updated.');
          
          }
          );

          const sum = [{"TotalAkumulasi" : maxNumber ,"Daily" : databaru}]

          res.json(sum);
    
      })
      .catch((error =>{ res.send((error)); }));
}