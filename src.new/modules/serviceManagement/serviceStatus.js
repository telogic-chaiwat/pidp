module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.serviceStatusSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.serviceStatusSchema.bodySchema');
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
  const mongoUpdate = this.utils().services('mongoFunction')
      .modules('update');
  const collectionName = this.utils().services('enum')
      .modules('collectionMongo');
  const confMongo = this.utils().services('mongo')
      .conf('default');
  const mongoFindUpdate = this.utils().services('mongoFunction').
      modules('findOneAndUpdate');
  const generateXTid = this.utils().services('basicFunction')
      .modules('generateXTid');

  const appName = this.appName || 'pidp';
  // const serviceName = 'ndid';
  const nodeCmd = 'identityServiceStatus';
  const identity = req.body.reference_id || '';

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

  if (req.body.requestReferenceId) {
    // update based on reference id
    const optionAttribut = {
      collection: collectionName.TRANSACTION,
      commandName: 'update_pidp_transaction',
      invoke: initInvoke,
      selector: {'requestReferenceId': req.body.requestReferenceId},
      update: {
        $set: {
          status: req.body.status,
        },
      },
      max_retry: confMongo.max_retry,
      timeout: (confMongo.timeout*1000),
      retry_condition: confMongo.retry_condition || 'CONNECTION_ERROR|TIMEOUT',
    };

    const getResponse = await mongoUpdate(this, optionAttribut);
    if (getResponse && getResponse == 'error') {
      this.stat(appName+' returned '+nodeCmd+' '+'system error');
      const resp = buildResponse(status.DB_ERROR);
      res.status(resp.status).send(resp.body);
      return;
    }

    // document is not found
    if (getResponse.n == 0) {
      this.stat(appName+' returned '+nodeCmd+' '+'error');
      const resp = buildResponse(status.DATA_NOT_FOUND);
      res.status(resp.status).send(resp.body);
      return;
    }
    const resp = buildResponse(status.SUCCESS);
    Object.assign(resp.body, {
      'resultData': [
        {
          'requestReferenceId': req.body.requestReferenceId,
        },
      ],
    });
    res.status(resp.status).send(resp.body);
    this.stat(appName+' returned '+nodeCmd+' '+'success');
  } else {
    const mongoOptAttribut = {
      collection: collectionName.TRANSACTION,
      commandName: 'update_pidp_transaction',
      invoke: initInvoke,
      query: {
        'citizen_id': req.body.identifier,
        'request_id': req.body.requestId,
        'serviceName': req.body.serviceId,
        'status': 'idp_response_confirm_success',
      },
      update: {
        $set: {
          status: req.body.status,
        },
      },
      options: {
        returnNewDocument: true,
      },
      max_retry: confMongo.max_retry,
      timeout: (confMongo.timeout*1000),
      retry_condition: confMongo.retry_condition,
    };

    const mongoResponse = await mongoFindUpdate(this, mongoOptAttribut);

    if (mongoResponse && mongoResponse == 'error') {
      this.stat(appName+' returned '+nodeCmd+' '+'system error');
      const resp = buildResponse(status.DB_ERROR);
      res.status(resp.status).send(resp.body);
      return;
    }

    if (!(mongoResponse.value)) {
      // not found
      this.stat(appName+' returned '+nodeCmd+' '+'error');
      const resp = buildResponse(status.DATA_NOT_FOUND);
      res.status(resp.status).send();
      return;
    }
    const resp = buildResponse(status.SUCCESS);
    Object.assign(resp.body, {
      'resultData': [
        {
          'requestReferenceId': mongoResponse.value.requestReferenceId,
        },
      ],
    });
    res.status(resp.status).send(resp.body);
    this.stat(appName+' returned '+nodeCmd+' '+'success');
  }
};


