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
_easynexmo2.default.sendTTSMessage('+393402485276', 'Rilevato errore connessione HermesHotels', {
  lg: 'it-IT'
});