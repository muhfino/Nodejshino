const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cron = require('node-cron');
const fetch = require('node-fetch');
var cors = require('cors')
var morgan = require('morgan');
const multer = require('multer');

const options = {
    inflate: true,
    limit: 1000,
    type: 'text/plain'
  };

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only videos are allowed.'));
  }
};

const upload = multer({ storage, fileFilter });

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw(options));
app.use(morgan('dev'));
app.use(cors());
app.use(upload.single('video'));

const pool = require("./db");

app.use(express.json()); 

app.use('/uploads', express.static('C:/New folder/HinoBoardApps-main/HinoBoardApps-main/uploads/'));

// const Crontask = require("./crondaily");
// const Crontask1 = require("./cronmonthly");

// Crontask.start();
// Crontask1.start();
// //panggil routes
var routes = require('./routes');
routes(app);

//daftarkan menu routes dari index
app.use('/auth', require('./middleware'));

app.listen(5000, () => {
    console.log("server is listening on port 5000");
})