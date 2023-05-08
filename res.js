'use strict';


//Function for Response API function when result is successful
exports.ok = function(values, res){
    var data = {
        'status':200,
        'values':values
    };

    console.log(values)
     res.json(data);
     res.end();
};

//Function for Response API when Login is successful
exports.okLogin = function(values, token, res){
    var data = {
        'status':200,
        'message':"Login Success",
        'token' : token,
        'values':values
    };

    console.log(values)
     res.json(data);
     res.end();
};

//Function for Response API when Login is Failed
exports.failed = function(values, res){
    var data = {
        'status':400,
        'message':"Login Failed",
        'value':values
    };

    console.log(values)
     res.json(data);
     res.end();
};
