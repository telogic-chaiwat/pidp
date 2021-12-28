module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.callbackResponseSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.callbackResponseSchema.bodySchema');
  // const validateToken = this.utils().submodules('validateToken').
  //    modules('validateToken');
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
  // const mongoFindOne = this.utils().services('mongoFunction')
  //    .modules('findOne');

  const appName = this.appName || 'pidp';
  // const serviceName = 'ndid';
  const nodeCmd = 'callback_idp_response';
  const identity = req.body.reference_id || '';
  const initInvoke = req.invoke;

  this.commonLog(req, nodeCmd, identity);

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema,
      'content-type');
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send();
    return;
  }

  /* responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    return;
  }*/

  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send();
    return;
  }

  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');
  /*
  const optionAttribut = {
    collection: collectionName.TRANSACTION,
    commandName: 'find_pidp_transaction',
    invoke: initInvoke,
    query: {'request_id': req.body.request_id},
    options: {
      limit: 1,
      sort: {request_at: -1},
    },
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition || 'CONNECTION_ERROR|TIMEOUT',

  };
  const getResponse = await mongoFindOne(this, optionAttribut);
  if (getResponse && getResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    res.status(resp.status).send();
    return;
  }

  if (!(getResponse)) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send();
    return;
  }

  /* let statusMC = 'wait_for_as';
  if (getResponse.status == 'confirmed' && req.body.success == true) {
    statusMC = 'wait_for_as';
  } else if (getResponse.status == 'confirmed' && req.body.success == false) {
    statusMC = 'confirmed_fail';
  }*/
  let statusMC = '';
  if (req.body.success == true) {
    statusMC = 'idp_response_confirm_success';
  } else {
    statusMC = 'idp_response_confirm_fail';
  }

  const optionAttributUpdate = {
    collection: collectionName.TRANSACTION,
    commandName: 'update_pidp_transaction',
    invoke: initInvoke,
    selector: {
      'requestReferenceId': req.body.reference_id,
      'request_id': req.body.request_id,
    },
    update: {
      $set: {
        'status': statusMC,
      },
    },
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition || 'CONNECTION_ERROR|TIMEOUT',
  };

  const updateResponse = await mongoUpdate(this, optionAttributUpdate);
  if (updateResponse && updateResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    res.status(resp.status).send();
    return;
  }

  // document is not found
  if (updateResponse.n == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send();
    return;
  }
  res.status(204).send();
  this.stat(appName+' returned '+nodeCmd+' '+'success');
};


