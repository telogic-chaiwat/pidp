/* eslint-disable max-len */
/**
  * this to send sms with myID API
 * @param {msisdn}  msisdn number phone.
 * @param {message} message is content of notification
 * @return {promise} response from server
*/
async function sendNotification(msisdn, message) {
  //
  const service = 'myIDS';
  const nodeName = 'notifications';
  const appName = this.appName;
  const tokens = this.utils().services('tokenFunction').
      modules('tokens');
  const sendGetToken = this.utils().services('tokenFunction').
      modules('sendGetToken');
  const randomstringHex = this.utils().services('basicFunction')
      .modules('randomstringHex');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');

  let notificationContent = 'default content';

  if (message) {
    notificationContent = message;
  }

  let accessToken = {
    tokenType: 'Bearer',
    accessToken: '',
  };

  if (tokens[service] && tokens[service].accessToken) {
    accessToken = tokens[service];
  } else {
    this.debug('cannot find access token to ' + service);
  }

  const headers = {
    'content-type': 'application/json',
    'x-method': 'POST',
  };
  if (tokens[service]) {
    Object.assign(headers,
        {'authorization': accessToken.tokenType + ' ' + accessToken.accessToken});
  }
  const body = {
    'state': await randomstringHex(),
    'msisdn': msisdn,
    'service_name': 'NDID',
    'message': notificationContent,

  };
  const optionAttribut = {
    method: 'POST',
    headers: headers,
    _service: service,
    _command: nodeName,
    data: body,
  };
  Object.assign(optionAttribut,
      {httpsAgent: createHttpsAgent(service, nodeName)});

  let response = await this.utils().http().request(optionAttribut);

  if ((this.utils().http().isError(response)) || (typeof response == 'undefined')) {
    return response;
  }

  if ( (typeof response != 'string') &&
  response.status && response.status == 401) {
    this.stat(appName+' recv '+service+' '+
              nodeName+' error system');
    this.summary().addErrorBlock(service, nodeName,
        response.status, 'unauthorized');
    response = await sendGetToken(service, response,
        optionAttribut);
  }
  if (response.status && response.status != 200) {
    const errorDesc = (response.status==404)?'data not found':
        (response.status==403 || response.status==401)?'unauthorized':
        (response.status==500)?'system error':
        'other error';
    this.stat(this.appName+' recv '+ service+' '+nodeName+' error response');
    this.summary().addErrorBlock(service, nodeName,
        response.status, errorDesc);
    return response;
  } else if (response && response.status == 200) {
    this.stat(this.appName+' recv '+service+' '+nodeName+' response');
    this.summary().addErrorBlock(service, nodeName,
        response.status, 'success');
    return response;
  } else {
    this.stat(this.appName+' recv '+service+' '+nodeName+' error response');
    this.summary().addErrorBlock(service, nodeName,
        'error', 'error');
    return response;
  }
};
module.exports.sendNotification =sendNotification;

/*
  module.exports.send = function(data) {
    return new Promise((resolve, reject)=>{
      const promises = [];
      if (Array.isArray(data) == false) {
        this.debug('msisdn data is not in array type');
        resolve();
      }


      for (let i = 0; i < data.length; i++) {
        promises.push(sendSMS.call(this, data[i]));
      }
      Promise.all(promises)
          .then((results) => {
            this.debug('all sms have been seet');
            resolve();
          })
          .catch((e) => {
            this.error('error while send sms, error meesage :/n' + err.message);
            resolve();
          });
    });

  };
  */

module.exports.sends =async function(data, message) {
  //
  if (Array.isArray(data) == false) {
    this.debug('msisdn data is not in array type');
    resolve();
  }
  for (let i = 0; i < data.length; i++) {
    await sendNotification.call(this, data[i], message);
  }
  return;
};

