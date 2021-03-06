'use strict';

var NodeRSA = require('node-rsa');
var { Certificate } = require('@fidm/x509')
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var SignedXml = require('xml-crypto').SignedXml;
var uuid = require('node-uuid');

var wsseSecurityHeaderTemplate = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'tbk-header.ejs')).toString());
var wsseSecurityTokenTemplate = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'tbk-token.ejs')).toString());

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function dateStringForSOAP(date) {
  return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
    ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + date.getUTCHours()).slice(-2) + ":" +
    ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
}

function generateCreated() {
  return dateStringForSOAP(new Date());
}

function generateExpires() {
  return dateStringForSOAP(addMinutes(new Date(), 10));
}

function insertStr(src, dst, pos) {
  return [dst.slice(0, pos), src, dst.slice(pos)].join('');
}

function generateId() {
  return uuid.v4().replace(/-/gm, '');
}

function TbkSecurityCert(privatePEM, publicP12PEM, password, encoding) {
  this.privateKey = new NodeRSA(privatePEM, 'pkcs1');
  this.publicP12PEM = publicP12PEM.toString().replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/(\r\n|\n|\r)/gm, '');
  
  this.signer = new SignedXml();
  this.signer.signingKey = this.privateKey.exportKey();
  
  var references = ["http://www.w3.org/2000/09/xmldsig#enveloped-signature",
  "http://www.w3.org/2001/10/xml-exc-c14n#"];
  
  this.signer.addReference("//*[local-name(.)='Body']", references);
  
  var _this = this;
  var cert = Certificate.fromPEM(publicP12PEM);
  var serial = parseInt(cert.serialNumber, 16);
  var iss = cert.issuer.attributes.map(function(attr) {
    return attr.shortName + '=' +attr.value
  });
  iss = iss.join(','); 
  this.signer.keyInfoProvider = {};
  this.signer.keyInfoProvider.getKeyInfo = function (key) {
    return wsseSecurityTokenTemplate({iss: iss, serial: serial, binaryToken: _this.publicP12PEM });
  };
}

TbkSecurityCert.prototype.postProcess = function (xml) {
  this.created = generateCreated();
  this.expires = generateExpires();

  var secHeader = wsseSecurityHeaderTemplate({
    binaryToken: this.publicP12PEM,
    created: this.created,
    expires: this.expires,
  });

  var xmlWithSec = insertStr(secHeader, xml, xml.indexOf('</soap:Header>'));

  this.signer.computeSignature(xmlWithSec);

  return insertStr(this.signer.getSignatureXml(), xmlWithSec, xmlWithSec.indexOf('</wsse:Security>'));
};

module.exports = TbkSecurityCert;
