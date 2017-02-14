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
    // overrideRootElement: {
    //   namespace: 'myns',
    //   xmlnsAttributes: [{
    //     name: 'xmlns:myns',
    //     value: 'http://webservices.webpayserver.transbank.com/'
    //   }]
    // }
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

  // finishInscription(token) {
  //   const params = { token };

  //   return soap.createClient(this.location)
  //     .then(client => {
  //       if(this.key && this.cert) {
  //         var wsSecurity = new soap.WSSecurityCert(this.key, this.cert, '', 'utf8');
  //         client.setSecurity(wsSecurity);
  //       }
  //       return client.finishInscription(params);
  //     });
  // }

  // authorize(amount, tbkUser, username, buyOrder) {
  //   const params = { amount, tbkUser, username, buyOrder };

  //   return soap.createClient(this.location)
  //     .then(client => {
  //       if(this.key && this.cert) {
  //         var wsSecurity = new soap.WSSecurityCert(this.key, this.cert, '', 'utf8');
  //         client.setSecurity(wsSecurity);
  //       }
  //       return client.authorize(params);
  //     });
  // }

  // reverse(buyOrder) {
  //   const params = { buyorder: buyOrder};

  //   return soap.createClient(this.location)
  //     .then(client => {
  //       if(this.key && this.cert) {
  //         var wsSecurity = new soap.WSSecurityCert(this.key, this.cert, '', 'utf8');
  //         client.setSecurity(wsSecurity);
  //       }
  //       return client.reverse(params);
  //     });
  // }

  // removeUser(tbkUser, username) {
  //   const params = { tbkUser, username };

  //   return soap.createClient(this.location)
  //     .then(client => {
  //       if(this.key && this.cert) {
  //         var wsSecurity = new soap.WSSecurityCert(this.key, this.cert, '', 'utf8');
  //         client.setSecurity(wsSecurity);
  //       }
  //       return client.reverse(params);
  //     });
  // }

module.exports = OneClick;
