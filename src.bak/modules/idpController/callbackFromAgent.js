module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.callbackfromAgentSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.callbackfromAgentSchema.bodySchema');
  const validateToken = this.utils().submodules('validateToken').
      modules('validateToken');
  const validateHeader = this.utils().submodules('validateHeader').
      modules('validateHeader');
  const validateBody = this.utils().submodules('validateBody').
      modules('validateBody');
  const status = this.utils().services('enum').
      modules('status');
  const buildResponse = this.utils().submodules('buildResponse')
      .modules('buildResponse');
  const generateJWT = this.utils().submodules('generateJWT')
      .modules('generateJWT');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');

  const appName = this.appName || 'pidp';
  const serviceName = 'ndid';
  const nodeCmd = 'callback_from_idp';
  const identity = req.body.reference_id || '';
  const initInvoke = req.invoke;

  this.commonLog(req, nodeCmd, identity);

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    return;
  }

  responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    return;
  }

  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    return;
  }

  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock(serviceName, nodeCmd, null, 'success');

  const accToken = await generateJWT();
  const configNDID = JSON.parse(process.env.server);
  // const setting = require('../../../pm2-dev.json');
  // eslint-disable-next-line max-len
  // const configNDID = (setting.apps[0].env.server);
  const url = (configNDID.use_https?'https':'http') +
        '://' + configNDID.app_host +
        (configNDID.app_port ? (':' + configNDID.app_port) : '') +
        '/idp/response';

  let cmdToNdid = 'idp_send_response_to_ndid';
  let serviceToNdid = 'ndid';
  let bodydata = {
    'reference_id': req.body.reference_id,
    'request_id': req.body.request_id,
    'callback_url': url,
    'aal': req.body.aal,
    'ial': req.body.ial,
    'status': req.body.status,
    'signature': req.body.signature,
    // 'accessor_id': '',
    //  'node_id': '',
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Tid': initInvoke,
    'Authorization': 'Bearer ' + accToken,
  };

  if (req.body.resultcode && req.body.resultcode != 20000) {
    cmdToNdid = 'idp_error_response';
    serviceToNdid = 'ndid';
    bodydata = {
      'reference_id': req.body.reference_id,
      'request_id': req.body.request_id,
      'callback_url': url,
      'node_id': req.body.node_id,
      'error_code': req.body.resultcode,
    };
  }

  const method = 'POST';
  const optionAttribut = {
    method: method,
    headers: headers,
    _service: serviceToNdid,
    _command: cmdToNdid,
    data: bodydata,
  };

  Object.assign(optionAttribut,
      {httpsAgent: createHttpsAgent(serviceToNdid, cmdToNdid)});

  const getResponse = await this.utils().http().request(optionAttribut);
  // check http response
  if (this.utils().http().isError(getResponse)) {
    this.stat(appName+' returned '+nodeCmd+' system error');
    const response = buildResponse(status.SYSTEM_ERROR);
    res.status(response.status).send();
    return;
  }

  if (getResponse.status != 202) {
    // eslint-disable-next-line max-len
    this.stat(appName+' recv '+serviceToNdid+' '+cmdToNdid+ ' error response');
    const errorDesc = (getResponse.data)?getResponse.data.error ||
    'error body is not found':
    'body is not found';
    this.summary().addErrorBlock(serviceToNdid, cmdToNdid,
        getResponse.status, errorDesc);
    this.stat(appName+' returned '+nodeCmd+' system error');
    const response = buildResponse(status.SYSTEM_ERROR);
    res.status(response.status).send();
    return;
  }

  this.stat(appName+' recv '+serviceToNdid+' '+cmdToNdid + ' response');
  this.summary().addErrorBlock(serviceToNdid, cmdToNdid,
      getResponse.status, 'success');

  res.status(204).send();
  this.stat(appName+' returned '+nodeCmd+' '+'success');
};


