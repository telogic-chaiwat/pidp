module.exports.sendErrorResponse = async function(body) {
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');
  const generateXTid = this.utils().services('basicFunction')
      .modules('generateXTid');
  const generateJWT = this.utils().submodules('generateJWT')
      .modules('generateJWT');
  const randomstring = require('randomstring');

  const randomstringHex = () => {
    return randomstring.generate({
      charset: 'hex',
    });
  };
  const appName = this.appName || 'pidp';
  const serviceNotif = 'ndid';
  const nodeNotif = 'idp_error_response';
  const accToken = await generateJWT();
  const initInvoke = this.detail().InitInvoke || generateXTid('ndid');

  const confNotif = this.utils().services(serviceNotif)
      .conf(nodeNotif);

  const headers = {
    'Content-Type': 'application/json',
    'X-Tid': initInvoke,
    'Authorization': 'Bearer ' + accToken,
  };

  let callbackURL = body.callback_url;
  if (body.callbackHandleURL) {
    // using configurable callback url
    callbackURL = (confNotif.callback_url)?
                    confNotif.callback_url[body.callbackHandleURL]?
                    confNotif.callback_url[body.callbackHandleURL]:
                    callbackURL:callbackURL;
  }

  if (!(callbackURL )) {
    // cannot fine value for callbackURL
    this.debug('use default url callback to send error response');
    const configNDID = JSON.parse(process.env.server);
    callbackURL = (configNDID.use_https?'https':'http') +
          '://' + configNDID.app_host +
          (configNDID.app_port ? (':' + configNDID.app_port) : '') +
          '/idp/response';
  }

  const optionAttribut = {
    method: 'POST',
    headers: headers,
    _service: serviceNotif,
    _command: nodeNotif,
    data: {
      'reference_id': body.reference_id || randomstringHex(),
      'request_id': body.request_id,
      'callback_url': callbackURL,
      'node_id': body.node_id,
      'error_code': body.error_code,
    },
  };

  if (body.urlCustom) {
    if (confNotif.custom_endpoint && confNotif.custom_endpoint[body.url]) {
      Object.assign(optionAttribut,
          {
            url: confNotif[body.url],
          });
    }
  }

  Object.assign(optionAttribut,
      {httpsAgent: createHttpsAgent(serviceNotif, nodeNotif)});

  const getResponse = await this.utils().http().request(optionAttribut);
  // check http response
  if (this.utils().http().isError(getResponse)) {
    // this.stat(appName+' returned '+nodeCmd+' system error');
  } else if (getResponse.status != 204 && getResponse.status != 202) {
    // eslint-disable-next-line max-len
    this.stat(appName+' recv '+serviceNotif+' '+nodeNotif+ ' error system');
    const errorDesc = 'system error';
    this.summary().addErrorBlock(serviceNotif, nodeNotif,
        getResponse.status, errorDesc);
    // this.stat(appName+' returned '+nodeCmd+' error system');
  } else {
    this.stat(appName+' recv '+serviceNotif+' '+nodeNotif + ' response');
    this.summary().addErrorBlock(serviceNotif, nodeNotif,
        getResponse.status, 'success');
  }
  return getResponse;
};


