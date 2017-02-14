'use strict';

var soap = require('./promise/as-promised');
var TbkSecurityCert = require('./security/tbk-cert');

function OneClick(production) {
  const integrationLoc  = 'https://webpay3gint.transbank.cl/webpayserver/wswebpay/OneClickPaymentService?wsdl';
  const productionLoc   = 'https://webpay3g.transbank.cl:443/webpayserver/wswebpay/OneClickPaymentService?wsdl';
  this.location = production ? productionLoc : integrationLoc;
}

OneClick.prototype.setSigningKeys = function(key, cert) {
  this.key = key;
  this.cert = cert;
};

OneClick.prototype.initInscription = function(username, email, responseURL) {
  const params = {
    arg0: {
      username,
      email,
      responseURL
    }
  };

  var wsdlOptions = {
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };
  var self = this;
  return soap.createClient(self.location, wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.initInscription(params);
    });
};

OneClick.prototype.finishInscription = function(token) {
  const params = {
    arg0: {
      token
    }
  };

  var wsdlOptions = {
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };
  var self = this;
  return soap.createClient(self.location, wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.finishInscription(params);
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

  var wsdlOptions = {
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };
  var self = this;
  return soap.createClient(self.location, wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.authorize(params);
    });
};

OneClick.prototype.reverse = function(buyOrder) {
  const params = {
    arg0: {
      buyorder: buyOrder
    }
  };

  var wsdlOptions = {
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };

  var self = this;
  return soap.createClient(self.location, wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.reverse(params);
    });
};

OneClick.prototype.removeUser = function(tbkUser, username) {
  const params = {
    arg0: {
      tbkUser,
      username
    }
  };

  var wsdlOptions = {
    overrideRootElement: {
      namespace: 'tbk',
      xmlnsAttributes: [{
        name: 'xmlns:tbk',
        value: 'http://webservices.webpayserver.transbank.com/'
      }]
    }
  };

  var self = this;
  return soap.createClient(self.location, wsdlOptions)
    .then(function(client) {
      if(self.key && self.cert) {
        var wsSecurity = new TbkSecurityCert(self.key, self.cert, '', 'utf8');
        client.setSecurity(wsSecurity);
      }
      return client.removeUser(params);
    });
};

module.exports = OneClick;
