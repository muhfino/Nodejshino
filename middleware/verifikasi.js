const jwt = require('jsonwebtoken');
const config = require('../config/secret');

function verifikasi(role){
    return function(req, rest, next){
        console.log(jwt);
        //cek authorizzation header
        var tokenWithBearer = req.headers.authorization;
        
        if(tokenWithBearer) {
            var token = tokenWithBearer.split(' ')[1];
            
            //verifikasi
            jwt.verify(token, config.secret, function(err, decoded){
                if(err){
                    return rest.status(401).send({auth:false, message:'Token tidak terdaftar!'});
                }else {
                    
                        req.auth = decoded;
                        next();
                   
                }
            });
        }else {
            return rest.status(401).send({auth:false, message:'Token tidak tersedia!'});
        }
    }
}

module.exports = verifikasi
