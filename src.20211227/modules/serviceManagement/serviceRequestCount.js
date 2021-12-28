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
  const mongoAggregate = this.utils().services('mongoFunction').
      modules('aggregate');
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
  const timeoutFilter = this.utils().submodules('timeoutFilter')
      .modules('timeoutFilter');

  const appName = this.appName || 'pidp';
  // const serviceName = 'ndid';
  const nodeCmd = 'identityServiceCount';
  const identity = req.body.identityValue || '';

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
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');

  const initInvoke = this.detail().InitInvoke || generateXTid(appName);
  // const currentTime = new Date().getTime();
  const query = [
    {
      '$match': {
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
      },
    },
  ];
  const mongoOptAttribut = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'query_identiy_request',
    invoke: initInvoke,
    query: query,
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  let mongoResponse = await mongoAggregate(this, mongoOptAttribut);

  if (mongoResponse && mongoResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.DB_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }
  if (Array.isArray(mongoResponse) == false) {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }
  mongoResponse = timeoutFilter(mongoResponse);
  if (Array.isArray(mongoResponse) && mongoResponse.length == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send(resp.body);
    return;
  }

  const resp = buildResponse(status.SUCCESS);

  Object.assign(resp.body, {
    resultData: [
      {
        'totalPendingItems': mongoResponse.length,
      },
    ],
  });


  res.status(resp.status).send(resp.body);
  this.stat(appName+' returned '+nodeCmd+' '+'success');
};


