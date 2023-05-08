var express = require('express');
var auth = require('./auth');
var router = express.Router();
// var verifikation = require('./verification');
var verifikasi = require('./verifikasi')

//daftarkan menu registrasi
//router.post('/api/v1/register', auth.registrasi);
router.post('/api/v1/login', auth.login);
router.post('/api/v1/ubahpassword', verifikasi(1), auth.ubahPassword);

router.get('/verify', auth.verifikasi)


//Repeat For SPEKTRUMKUDEV.com
//====================================================================
router.get('/hmsi/board/api/api/v1/admin/config', verifikasi(1), auth.adminconfig);

//daftarkan menu registrasi
//router.post('/hmsi/board/api/api/v1/register', auth.registrasi);
router.post('/hmsi/board/api/api/v1/login', auth.login);
router.post('/hmsi/board/api/api/auth/v1/login', auth.login);
router.post('/hmsi/board/api/api/v1/ubahpassword', verifikasi(1), auth.ubahPassword);

router.get('/hmsi/board/api/verify', auth.verifikasi)

//alamat yang perlu otorisasi
//halaman menampilkan data tabel oleh administrator
router.get('/hmsi/board/api/api/v1/admin/config', verifikasi(1), auth.adminconfig);

module.exports = router;