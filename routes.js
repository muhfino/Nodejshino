'use strict';

module.exports = function (app) {
    //Initiate class from related function 
    var jsonku = require('./controller');
    var auth = require('./middleware/auth');
    var verifikasi = require('./middleware/verifikasi')

    //Route for Production, without preliminary path
    //=============================================================

    //Route for Index, uptime check
    app.route('/')
        .get(jsonku.index);
    
    //Route for update config Board System
    app.route('/crudconfig')
        .post(verifikasi(1),jsonku.crudConfig);

    //Route for show config Board System
    app.route('/showconfig')
        .get(verifikasi(1),jsonku.showconfig);
    
    //Route for Login, System currently use this type of login, directly access DMS
    app.route('/login')
        .post(jsonku.getUserLogin);
    
    //Previously use for Login with Tokenized user, currently available but not yet accessed from frontend
    app.route('/auth/login')
        .post(auth.login);

    //Previously use for Change Password with Tokenized user, currently available but not yet accessed from frontend
    app.route('/auth/changepassword')
        .post(verifikasi(1),auth.ubahPassword);

    //Previously use for Verify with Tokenized user, currently available but not yet accessed from frontend
    app.route('/verify')
        .post(auth.verifikasi);

    //Route for Middleware to  access DMS Worker Info API
    app.route('/workerinfo')
        .post(verifikasi(1),jsonku.workInfo);

    //Route for Middleware to  access DMS Booking Allocation API
    app.route('/bookingallocation')
        .post(verifikasi(1),jsonku.BookingAllocation);

    app.route('/masterrepcode')
        .post(verifikasi(1),jsonku.masterrepcode);

    //=======================================================
    //Route for Testing, with preliminary path hmsi/board/api 
    //Same function as route above, just differential on Preliminary path
    app.route('/hmsi/board/api')
        .get(jsonku.index);

   app.route('/hmsi/board/api/crudconfig')
        .post(verifikasi(1),jsonku.crudConfig);

    app.route('/hmsi/board/api/showconfig')
        .get(verifikasi(1),jsonku.showconfig);

    app.route('/hmsi/board/api/login')
        .post(jsonku.getUserLogin);

    app.route('/hmsi/board/api/auth/login')
        .post(auth.login);

    app.route('/hmsi/board/api/auth/changepassword')
        .post(verifikasi(1),auth.ubahPassword);

    app.route('/hmsi/board/api/verify')
        .post(auth.verifikasi);

    app.route('/hmsi/board/api/workerinfo')
        .post(verifikasi(1),jsonku.workInfo);

    app.route('/hmsi/board/api/bookingallocation')
        .post(verifikasi(1),jsonku.BookingAllocation);

    app.route('/hmsi/board/api/masterrepcode')
        .post(verifikasi(1),jsonku.masterrepcode);

    app.route('/hmsi/board/api/holiday')
        .post(verifikasi(1),jsonku.holiday);

    app.route('/hmsi/board/api/videos')
        .post(verifikasi(1),jsonku.video);
    
    app.route('/hmsi/board/api/get/video/:companycode')
        .get(verifikasi(1), jsonku.get_video);

    app.route('/hmsi/board/api/get/video')
        .get(verifikasi(1), jsonku.all_video);

    app.route('/hmsi/board/api/delete/video/:id')
        .get(verifikasi(1), jsonku.videodelete);

    app.route('/hmsi/board/api/spektrumku')
        .post(verifikasi(1),jsonku.spektrumku);

    // app.route('/hmsi/board/api/spektrumkuCRONJOB')
    // .post(verifikasi(1),jsonku.spektrumkuCRONJOB);

}