var OneClick = require('./main').OneClick;
var fs = require('fs');
var path = require('path');

var key = fs.readFileSync(path.join(__dirname, 'keys', '597020000547.key'));
var cert = fs.readFileSync(path.join(__dirname, 'keys', '597020000547.crt'));
var oneClick = new OneClick();

oneClick.setSigningKeys(key, cert);
oneClick.setValidationCert(fs.readFileSync(path.join(__dirname, 'keys', 'tbk.pem')));

var promise = oneClick.initInscription('asd', 'asd@gmail.com', 'www.google.com');

promise.then(res => console.log(res));
promise.catch(err => console.log(err));
