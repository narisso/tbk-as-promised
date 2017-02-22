'use strict';

var soap = require('./promise/as-promised');
var TbkSecurityCert = require('./security/tbk-cert');
var SignedXml = require('xml-crypto').SignedXml;
var FileKeyInfo = require('xml-crypto').FileKeyInfo;
var select = require('xml-crypto').xpath;
var fs = require('fs');
var Dom = require('xmldom').DOMParser;
var HttpClient = require('./http/http');

function OneClick(production) {
  const integrationLoc  = 'https://webpay3gint.transbank.cl/webpayserver/wswebpay/OneClickPaymentService?wsdl';
  const productionLoc   = 'https://webpay3g.transbank.cl:443/webpayserver/wswebpay/OneClickPaymentService?wsdl';
  this.location = production ? productionLoc : integrationLoc;
  this.wsdlOptions = {
    httpClient: new HttpClient(),
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };
}

SignedXml.prototype.validateSignatureValue = function() {
  var signedInfo = select(this.signatureNode, "//*[local-name(.)='SignedInfo']");
  if (signedInfo.length==0) throw new Error("could not find SignedInfo element in the message")

  var inclusiveNamespaces = select(signedInfo[0], "//*[local-name(.)='InclusiveNamespaces']");
  var inclusiveNamespacesPrefixList = [];
  if (inclusiveNamespaces.length > 0) {
    inclusiveNamespacesPrefixList = inclusiveNamespaces[0].getAttribute('PrefixList');
  }

  var modifiedSignedInfo = signedInfo[0];
  modifiedSignedInfo.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:soap', 'http://schemas.xmlsoap.org/soap/envelope/');

  var signedInfoCanon = this.getCanonXml([this.canonicalizationAlgorithm], modifiedSignedInfo, { inclusiveNamespacesPrefixList: inclusiveNamespacesPrefixList })
  var signer = this.findSignatureAlgorithm(this.signatureAlgorithm)
  var res = signer.verifySignature(signedInfoCanon, this.signingKey, this.signatureValue)
  if (!res) this.validationErrors.push("invalid signature: the signature value " +
                                        this.signatureValue + " is incorrect")
  return res
}

SignedXml.prototype.loadSignaturePatch = function(signatureNode) {
  this.loadSignature(signatureNode);
  this.signatureValue = select(this.signatureNode, ".//*[local-name(.)='SignatureValue']/text()")[0].data
}

function StringKeyInfo(key) {
  this.key = key.toString();
  
  this.getKeyInfo = function(key, prefix) {
    prefix = prefix || ''
    prefix = prefix ? prefix + ':' : prefix
      return "<" + prefix + "X509Data></" + prefix + "X509Data>"
  }

  this.getKey = function(keyInfo) {
    return this.key
  }
}

function Validate(res, publicCert) {
  var doc = new Dom().parseFromString(res._rawResponse);
  var sig = new SignedXml();
  var signature = select(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0]
  
  sig.keyInfoProvider = new StringKeyInfo(publicCert);
  sig.loadSignaturePatch(signature);

  var check = sig.checkSignature(res._rawResponse);
  if (!check) {
    console.log(sig.validationErrors);
  } 

  return check;
}

OneClick.prototype.setSigningKeys = function(key, cert) {
  this.key = key;
  this.cert = cert;
};

OneClick.prototype.setRequestCallback = function(func) {
  this.wsdlOptions.httpClient.setRequestCallback(func);
};


OneClick.prototype.setValidationCert = function(cert) {
  this.publicCert = cert;
};

OneClick.prototype.initInscription = function(username, email, responseURL) {
  const params = {
    arg0: {
      username,
      email,
      responseURL
    }
  };

  var self = this;
  return soap.createClient(self.location, this.wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.initInscription(params)
        .then(function(res) {
          if(!self.publicCert) {
            return res;
          }
          
          var valid = Validate(res, self.publicCert);
          if(!valid) {
            throw Error('Public key validation failed.')
          }

          return res;
        });
    });
};

OneClick.prototype.finishInscription = function(token) {
  const params = {
    arg0: {
      token
    }
  };

  var self = this;
  return soap.createClient(self.location, this.wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.finishInscription(params)
        .then(function(res) {
          if(!self.publicCert) {
            return res;
          }
          
          var valid = Validate(res, self.publicCert);
          if(!valid) {
            throw Error('Public key validation failed.')
          }

          return res;
        });
    });
};

OneClick.prototype.authorize = function(amount, tbkUser, username, buyOrder) {
  const params = {
    arg0: {
      amount,
      tbkUser,
      username,
      buyOrder
    }
  };

  var self = this;
  return soap.createClient(self.location, this.wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.authorize(params)
        .then(function(res) {
          if(!self.publicCert) {
            return res;
          }
          
          var valid = Validate(res, self.publicCert);
          if(!valid) {
            throw Error('Public key validation failed.')
          }

          return res;
        });
    });
};

OneClick.prototype.reverse = function(buyOrder) {
  const params = {
    arg0: {
      buyorder: buyOrder
    }
  };

  var self = this;
  return soap.createClient(self.location, this.wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.reverse(params)
        .then(function(res) {
          if(!self.publicCert) {
            return res;
          }
          
          var valid = Validate(res, self.publicCert);
          if(!valid) {
            throw Error('Public key validation failed.')
          }

          return res;
        });
    });
};

OneClick.prototype.removeUser = function(tbkUser, username) {
  const params = {
    arg0: {
      tbkUser,
      username
    }
  };


  var self = this;
  return soap.createClient(self.location, this.wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.removeUser(params)
        .then(function(res) {
          if(!self.publicCert) {
            return res;
          }
          
          var valid = Validate(res, self.publicCert);
          if(!valid) {
            throw Error('Public key validation failed.')
          }

          return res;
        });
    });
};

module.exports = OneClick;
