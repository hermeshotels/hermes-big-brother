'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _mongodb = require('mongodb');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _easynexmo = require('easynexmo');

var _easynexmo2 = _interopRequireDefault(_easynexmo);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
app.use((0, _serveFavicon2.default)(__dirname + '/public/favicon.ico'));
app.use(_express2.default.static('lib/public/assets'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'jade');
_easynexmo2.default.initialize('79f0b103', '2947cd56', true);

/*
Database
*/
var servers = null;
var failConsecutive = 0;
//mongoose.connect("mongodb://brother:hermes2015@ds015879.mlab.com:15879/hermes-status");
var dbUri = 'mongodb://brother:hermes2015@ds015879.mlab.com:15879/hermes-status';
_mongodb.MongoClient.connect(dbUri, function (err, db) {
  if (err) console.error(err);
  console.log('Connected to the database Hermes-Status');
  servers = db.collection('servers');
  /*
  Search for a server document with the given name, we actually manage only one server
  */
  servers.find({ name: 'HermesHotels Central Data' }).toArray(function (err, data) {
    if (err) console.error(err);
    if (data.length <= 0) {
      servers.insert({
        name: 'HermesHotels Central Data',
        status: true,
        fail: 0,
        success: 0,
        lastCheck: new Date()
      });
    }
  });
  /*
  Check the connection every 2 minutes
  */
  checkHermes(db, servers);
  setInterval(function () {
    checkHermes(db, servers);
  }, 120000);
});

/*
Server check every 2 minutes
*/
var smsSent = false;
var callDone = false;
function checkHermes(db, servers) {
  console.log('Starting server check');
  (0, _request2.default)({
    uri: 'https://secure.hermeshotels.com/bol/dispo.do?caId=138&hoId=1311'
  }, function (error, response, body) {
    var status = body.indexOf('HOTEL CHIMERA');
    var currentTime = (0, _momentTimezone2.default)().tz('Europe/Rome').format('LLLL');
    if (status === -1) {

      if (!smsSent) {
        //Server down send notification
        //Wanny
        _easynexmo2.default.sendTextMessage('HermesBigBr', '+393888108490', 'HH - Errore di connessione');
        //Romano
        _easynexmo2.default.sendTextMessage('HermesBigBr', '+393485592637', 'HH - Errore di connessione');
        //Giuseppina
        _easynexmo2.default.sendTextMessage('HermesBigBr', '+393402485276', 'HH - Errore di connessione');
      }

      failConsecutive = failConsecutive + 1;
      if (failConsecutive > 5 && smsSent && !callDone) {
        //Make voice call to Romano
        _easynexmo2.default.sendTTSMessage('+393485592637', 'Rilevato errore connessione HermesHotels', {
          lg: 'it-IT',
          repeat: 2
        });
      }
      //Find the document and increment it by 1
      servers.findOneAndUpdate({ name: 'HermesHotels Central Data' }, { $inc: { fail: +1 }, $set: { status: false, lastCheck: currentTime } });
    } else {
      servers.findOneAndUpdate({ name: 'HermesHotels Central Data' }, { $inc: { success: +1 }, $set: { status: true, lastCheck: currentTime } });
      smsSent = false;
      callDone = false;
      failConsecutive = 0;
    }
  });
}
/*
Routes
*/
app.get('/', function (req, res) {
  var server = servers.findOne({ name: 'HermesHotels Central Data' }, function (err, doc) {
    if (err) throw err;
    res.render('index', { server: doc });
  });
});

app.listen(80, function () {
  console.log('Example app listening on port 3000!');
});