/* eslint-disable max-len */
/**
  * this to send sms with myID API
 * @param {msisdn}  msisdn number phone.
 * @return {promise} response from server
*/
async function sendNotification(msisdn) {
  //
  const service = 'myIDS';
  const nodeName = 'notifications';
  const tokens = this.utils().services('tokenFunction').
      modules('tokens');
  const randomstringHex = this.utils().services('basicFunction')
      .modules('randomstringHex');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');

  const notificationContent = this.utils().app().const('notification_content');

  const headers = {
    'content-type': 'application/json',
    'x-method': 'POST',
  };
  if (tokens[service]) {
    Object.assign(headers,
        {'authorization': tokens[service].tokenType + ' ' + tokens[service].accessToken || ''});
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

  const response = await this.utils().http().request(optionAttribut);

  if ((this.utils().http().isError(response)) || (typeof response == 'undefined')) {
    return response;
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

module.exports.sends =async function(data) {
  //
  if (Array.isArray(data) == false) {
    this.debug('msisdn data is not in array type');
    resolve();
  }
  for (let i = 0; i < data.length; i++) {
    await sendNotification.call(this, data[i]);
  }
  return;
};

