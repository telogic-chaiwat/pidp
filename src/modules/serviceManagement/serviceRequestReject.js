module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.serviceRequestCountSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.serviceRequestCountSchema.bodySchema');
  const validateToken = this.utils().submodules('validateToken').
      modules('validateToken');
  const validateHeader = this.utils().submodules('validateHeader').
      modules('validateHeader');
  const validateBody = this.utils().submodules('validateBody').
      modules('validateBody');
  const mongoFind = this.utils().services('mongoFunction').
      modules('find');
  const generateXTid = this.utils().services('basicFunction')
      .modules('generateXTid');
  const confMongo = this.utils().services('mongo')
      .conf('default');
  const status = this.utils().services('enum').
      modules('status');
  const buildResponse = this.utils().submodules('buildResponse')
      .modules('buildResponse');
  const collectionName = this.utils().services('enum')
      .modules('collectionMongo');
  // const calculateTimeOut = this.utils().services('basicFunction')
  //    .modules('calculateTimeOut');
  const sendErrorResponse = this.utils().submodules('errorResponse')
      .modules('sendErrorResponse');
  const timeoutFilter = this.utils().submodules('timeoutFilter')
      .modules('timeoutFilter');

  const randomstring = require('randomstring');

  const randomstringHex = () => {
    return randomstring.generate({
      charset: 'hex',
    });
  };

  const appName = this.appName || 'pidp';
  // const serviceName = 'ndid';
  const nodeCmd = 'identityServiceReject';
  const identity = req.body.identityValue || '';

  this.commonLogAsync(req, nodeCmd, identity);

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
    responseError.body.developerMessage;
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
    responseError.body.developerMessage;
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
    responseError.body.developerMessage;
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');

  const initInvoke = this.detail().InitInvoke || generateXTid(appName);
  // const currentTime = new Date().getTime();
  const query = {
    'namespace': req.body.identityType,
    'identifier': req.body.identityValue,
    'closed': {
      '$ne': true,
    },
    'timed_out': {
      '$ne': true,
    },
    '$or': [{
      'status': null,
    }, {
      'status': 'pending',
    }],
    'request_timeout': {
      $gte: 300,
    },
    // '$expr': {
    //  $lte: [currentTime, calculateTimeOut],
    // },
  };

  const mongoOptAttribut = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'query_identity_request',
    invoke: initInvoke,
    query: query,
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  let mongoResponse = await mongoFind(this, mongoOptAttribut);

  if (mongoResponse && mongoResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.DB_ERROR);
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                    resp.body.developerMessage;
    res.status(resp.status).send(resp.body);
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }
  if (Array.isArray(mongoResponse) == false) {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                    resp.body.developerMessage;
    res.status(resp.status).send(resp.body);
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }
  mongoResponse = timeoutFilter(mongoResponse);
  if (Array.isArray(mongoResponse) && mongoResponse.length == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send(resp.body);
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                    resp.body.developerMessage;
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }
  const resp = buildResponse(status.SUCCESS);
  const resCode = resp.body.resultCode;
  const resDesc = resp.body.resultDescription ||
                  resp.body.developerMessage;
  Object.assign(resp.body, {
    resultData: [
      {
        'totalRejectItems': mongoResponse.length,
      },
    ],
  });
  res.status(resp.status).send(resp.body);
  await this.waitFinished();
  this.stat(appName+' returned '+nodeCmd+' '+'success');

  // 21-10-2021 send to API

  for (let i = 0; i < mongoResponse.length; i++) {
    const identityRequest = mongoResponse[i];
    const body = {
      'reference_id': randomstringHex(),
      'request_id': identityRequest.request_id,
      'callbackHandleURL': 'serviceRequestRejectModule',
      'node_id': identityRequest.node_id,
      'errorCode': 30610,
      'urlCustom': 'serviceRequestRejectModule',
    };
    await sendErrorResponse.call(this, body);
  }

  // this.stat(appName+' returned '+nodeCmd+' '+'success');
  this.detail().end();
  this.summary().endASync(resCode, resDesc);
};


