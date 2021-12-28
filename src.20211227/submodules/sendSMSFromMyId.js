/* eslint-disable max-len */
/**
  * this to send sms with myID API
 * @param {msisdn}  msisdn number phone.
 * @return {promise} response from server
*/
async function sendSMS(msisdn,smsContent) {
  //
  const service = 'myIDS';
  const nodeName = 'sms';
  const appName = this.appName;
  const tokens = this.utils().services('tokenFunction').
      modules('tokens');
  const sendGetToken = this.utils().services('tokenFunction').
      modules('sendGetToken');
  const generateRandomString = this.utils().services('basicFunction')
      .modules('generateRandomString');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');

  //const smsContent = this.utils().app().const('sms_content');


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
    'authorization': accessToken.tokenType + ' ' + accessToken.accessToken,
    'x-method': 'POST',
  };

  const body = {
    'state': await generateRandomString(),
    'msisdn': msisdn,
    'service_name': 'NDID',
    'content': smsContent,

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
    return;
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
module.exports.sendSMS =sendSMS;

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

module.exports.send =async function(data,content) {
  //
  if (Array.isArray(data) == false) {
    this.debug('msisdn data is not in array type');
    resolve();
  }
  for (let i = 0; i < data.length; i++) {
    await sendSMS.call(this, data[i],content);
  }
  return;
};
