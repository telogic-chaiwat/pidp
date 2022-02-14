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
  const enrollchecking = this.utils().submodules('checkEnroll')
      .modules('checkEnroll');

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

  // 27-01-2022 NEW REQ
  const responseEnroll = await enrollchecking( ()=>{

  }, {
    id_card: req.body.identityValue,
  });
  if (this.utils().http().isError(responseEnroll)) {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.DB_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }
  if (responseEnroll.status != 200) {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }
  if (responseEnroll.data && responseEnroll.data.resultCode == '20020') {
    this.stat(appName+' returned '+nodeCmd+' '+'success');
    const resp = buildResponse(status.DATA_NOT_FOUND_200);
    res.status(resp.status).send(resp.body);
    return;
  }

  let revokeTime = null;
  if (responseEnroll.data && responseEnroll.data.resultData &&
    Array.isArray(responseEnroll.data.resultData)) {
    revokeTime = responseEnroll.data.resultData[0].revoke_time;
  }

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
        'creation_time': {
          '$gt': revokeTime,
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
  /* if (Array.isArray(mongoResponse) && mongoResponse.length == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send(resp.body);
    return;
  }*/

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


