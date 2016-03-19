import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import serveFavicon from 'serve-favicon'
import {MongoClient} from 'mongodb'
import request from 'request';
import cheerio from 'cheerio';
import nexmo from 'easynexmo';
import moment from 'moment-timezone';

let app = express();
app.use(serveFavicon(__dirname + '/public/favicon.ico'));
app.use(express.static('lib/public/assets'));
app.set('views', __dirname + '/public/views');
app.set('view engine', 'jade');
nexmo.initialize('79f0b103', '2947cd56', true);

/*
Database
*/
let servers = null;
let failConsecutive = 0;
//mongoose.connect("mongodb://brother:hermes2015@ds015879.mlab.com:15879/hermes-status");
var dbUri = 'mongodb://brother:hermes2015@ds015879.mlab.com:15879/hermes-status'
MongoClient.connect(dbUri, function(err, db){
  if(err) console.error(err);
  console.log('Connected to the database Hermes-Status');
  servers  = db.collection('servers');
  /*
  Search for a server document with the given name, we actually manage only one server
  */
  servers.find({name: 'HermesHotels Central Data'}).toArray(function(err, data){
    if(err) console.error(err);
    if(data.length <= 0){
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
  setInterval(function(){
    checkHermes(db, servers);
  }, 120000);
});

/*
Server check every 2 minutes
*/
var smsSent = false;
var callDone = false;
function checkHermes(db, servers){
  console.log('Starting server check');
  request({
    uri: 'https://secure.hermeshotels.com/bol/dispo.do?caId=138&hoId=1311'
  }, function(error, response, body){
    var status = body.indexOf('HOTEL CHIMERA');
    var currentTime = moment().tz('Europe/Rome').format('LLLL');
    if(status === -1){

      if(!smsSent){
        //Server down send notification
        //Wanny
        nexmo.sendTextMessage('HermesBigBr', '+393888108490', 'HH - Errore di connessione');
        //Romano
        //nexmo.sendTextMessage('HermesBigBr', '+393485592637', 'HH - Errore di connessione');
        //Giuseppina
        //nexmo.sendTextMessage('HermesBigBr', '+393402485276', 'HH - Errore di connessione');
        smsSent = true;
      }

      failConsecutive = failConsecutive + 1;
      if(failConsecutive > 5 && smsSent && !callDone){
        //Make voice call to Romano
        nexmo.sendTTSMessage('+393485592637', 'Rilevato errore connessione HermesHotels', {
          lg: 'it-IT',
          repeat: 2
        });
        callDone = true;
      }
      //Find the document and increment it by 1
      servers.findOneAndUpdate({name: 'HermesHotels Central Data'}, {$inc: {fail: +1}, $set: {status: false, lastCheck: currentTime}});
    }else{
      servers.findOneAndUpdate({name: 'HermesHotels Central Data'}, {$inc: {success: +1}, $set: {status: true, lastCheck: currentTime}});
      smsSent = false;
      callDone = false;
      failConsecutive = 0;
    }
  });
}
/*
Routes
*/
app.get('/', function(req, res){
  var server = servers.findOne({name: 'HermesHotels Central Data'}, function(err, doc){
    if(err) throw err;
    res.render('index', {server: doc});
  });
});

app.listen(80, function () {
  console.log('Example app listening on port 3000!');
});
