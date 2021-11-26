module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.serviceResponseSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.serviceResponseSchema.bodySchema');
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
  const mongoUpdate = this.utils().services('mongoFunction').
      modules('update');
  const collectionName = this.utils().services('enum')
      .modules('collectionMongo');
  const confMongo = this.utils().services('mongo')
      .conf('default');
  const generateXTid = this.utils().services('basicFunction')
      .modules('generateXTid');
  const generateJWT = this.utils().submodules('generateJWT')
      .modules('generateJWT');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');
  const mongoFindUpdate = this.utils().services('mongoFunction').
      modules('findOneAndUpdate');
  const updateEnroll = this.utils().submodules('updateEnroll')
      .modules('updateEnroll');
  const sendErrorResponse = this.utils().submodules('errorResponse')
      .modules('sendErrorResponse');

  const appName = this.appName || 'pidp';
  const nodeCmd = 'identityServiceResponse';
  const bodydata = JSON.parse(JSON.stringify(req.body || {}));
  const identity = bodydata.requestReferenceId || '';
  const requestData = JSON.parse(JSON.stringify(bodydata || {}));
  this.commonLogAsync(req, nodeCmd, identity);

  const returnError = async (statusRes=status.SYSTEM_ERROR) =>{
    if (statusRes == status.SYSTEM_ERROR) {
      this.stat(appName+' returned '+nodeCmd+' '+'system error');
    } else {
      this.stat(appName+' returned '+nodeCmd+' '+'error');
    }
    const resp = buildResponse(statusRes);
    if (res.writableFinished == false) {
      res.status(resp.status).send(resp.body);
      await this.waitFinished();
    }
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                      resp.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  };

  const returnUpdate = async (resp)=>{
    if (!(resp)) {
      resp = buildResponse(status.SYSTEM_ERROR);
    }
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                      resp.body.developerMessage;

    // await this.waitFinished();
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  };

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    await this.waitFinished();
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
                        responseError.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    await this.waitFinished();
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
                                responseError.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    await this.waitFinished();
    const resCode = responseError.body.resultCode;
    const resDesc = responseError.body.resultDescription ||
                            responseError.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  // success validation input
  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');

  // bodydata.services.forEach((service) => {
  //  if (service.serviceOutputValue) {
  //    service.serviceOutputValue = encodeBase64(service.serviceOutputValue);
  //  }
  // });

  requestData.services.forEach((service) => {
    if (service.serviceOutputValue) {
      service.serviceOutputValue = '';
    }
  });

  const initInvoke = this.detail().InitInvoke || generateXTid(appName);
  /*
  const query = {
    'requestReferenceId': bodydata.requestReferenceId,
  };

  const options = {
    projection: {
      _id: 0,
      request_id: 1,
      citizen_id: 1,
      serviceName: 1,
      min_ial: 1,
      min_aal: 1,
      signature: 1,
      customerReferenceId: 1,
      confirmCode: 1,
    },
  };

  let mongoOptAttribut = {
    collection: collectionName.TRANSACTION,
    commandName: 'find_pidp_transaction',
    invoke: initInvoke,
    query: query,
    options: options,
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  const mcTransactionDocList = await mongoFind(this, mongoOptAttribut);

  if (mcTransactionDocList && mcTransactionDocList == 'error') {
    await returnError(status.SYSTEM_ERROR);
    return;
  }
  if (Array.isArray(mcTransactionDocList) == false) {
    await returnError(status.SYSTEM_ERROR);
    return;
  }
  if (Array.isArray(mcTransactionDocList) && mcTransactionDocList.length == 0) {
    await returnError(status.DATA_NOT_FOUND);
    return;
  }
  */
  const bodyDataServices = (bodydata.services && bodydata.services.length ) ?
  bodydata.services[0] : {};

  const doc = {
    $set: {
      'channelName': bodydata.channelName,
      'locationCode': bodydata.locationCode,
      'userId': bodydata.userId,
      'serviceResultCode': bodyDataServices.serviceResultCode,
      'serviceResultMessage': bodyDataServices.serviceResultMessage,
      'serviceOutputFormat': bodyDataServices.serviceOutputFormat,
      // 'serviceOutputValue': (bodyDataServices.serviceResultCode == '20000') ?
      //                        bodyDataServices.serviceOutputValue : '',
      'status': (bodyDataServices.serviceResultCode == '20000') ?
                  'confirmed' : 'reject',
    },
  };

  mongoOptAttribut = {
    collection: collectionName.TRANSACTION,
    commandName: 'update_pidp_transaction',
    invoke: initInvoke,
    query: {
      'requestReferenceId': bodydata.requestReferenceId,
      'citizen_id': bodydata.identityValue,
    },
    update: doc,
    options: {'projection': {_id: 0},
      'returnOriginal': false},
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  const mongoResponse = await mongoFindUpdate(this, mongoOptAttribut);

  if (mongoResponse && mongoResponse == 'error') {
    await returnError(status.DB_ERROR);
    return;
  }

  if (!(mongoResponse.value)) {
    // not found
    await returnError(status.DATA_NOT_FOUND);
    return;
  }

  let mcTransaction = {};

  mcTransaction = mongoResponse.value;
  if (mcTransaction.serviceName !== bodyDataServices.serviceName ||
        mcTransaction.citizen_id !== bodydata.identityValue) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.MISSING_INVALID_PARAMETER);
    res.status(resp.status).send(resp.body);
    await this.waitFinished();
    const resCode = resp.body.resultCode;
    const resDesc = resp.body.resultDescription ||
                      resp.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    return;
  }

  // const resp = buildResponse(status.SUCCESS);
  // this.stat(appName+' returned '+nodeCmd+' '+'success');
  // res.status(resp.status).send(resp.body);
  // await this.waitFinished();

  let resultcodeNumber = null;
  try {
    resultcodeNumber = parseInt(bodyDataServices.serviceResultCode, 10);
  } catch (err) {
    this.error('service result code is not number : ' +
        bodyDataServices.serviceResultCode);
    resultcodeNumber = 0;
  }

  if (bodyDataServices.serviceResultCode === '20000' &&
            (!(bodyDataServices.serviceName === 'verify'))) {
    // update enrollment
    let statusEnroll = '';
    let bodyToEnroll = {};
    try {
      bodyToEnroll = JSON.parse(bodyDataServices.serviceOutputValue);
    } catch (err) {
      // eslint-disable-next-line max-len
      this.debug('error parsing serviceOutputValue, error message : '+ err.message);
      statusEnroll = 'error';
    }
    if (statusEnroll == 'error') {
      await returnError();
      return;
    }
    const respEnroll = await updateEnroll(bodyToEnroll);
    let resp = buildResponse(status.SYSTEM_ERROR);
    if (this.utils().http().isError(respEnroll)) {
      statusEnroll = 'enroll_update_fail';
      resp = buildResponse(status.DB_ERROR);
      res.status(resp.status).send(resp.body);
    } else if (respEnroll && respEnroll.status == 200) {
      // data not founc developer_message == 20020
      if (respEnroll.data.resultCode == '20020') {
        statusEnroll = 'enroll_update_fail';
        resp = buildResponse(status.DATA_NOT_FOUND);
        res.status(resp.status).send(resp.body);
      } else {
        statusEnroll = 'enroll_update_sucess';
      }
    } else {
      statusEnroll = 'enroll_update_fail';
      resp = buildResponse(status.SYSTEM_ERROR);
      res.status(resp.status).send(resp.body);
    }

    // update transaction
    const mongoAtrributeUpdate = {
      collection: collectionName.TRANSACTION,
      commandName: 'update_pidp_transaction',
      invoke: initInvoke,
      selector: {
        'requestReferenceId': bodydata.requestReferenceId,
      },
      update: {
        $set: {
          'status': statusEnroll,
        },
      },
      options: {projection: {_id: 0}},
      max_retry: confMongo.max_retry,
      timeout: (confMongo.timeout*1000),
      retry_condition: confMongo.retry_condition,
    };

    const updateResp = await mongoUpdate(this, mongoAtrributeUpdate);

    if (updateResp && updateResp == 'error') {
      this.stat(appName+' returned '+nodeCmd+' '+' error');
      resp = buildResponse(status.DB_ERROR);
      res.status(resp.status).send(resp.body);
      await returnUpdate(resp);
      return;
    }

    // document is not found
    if (updateResp.n == 0) {
      this.stat(appName+' returned '+nodeCmd+' '+'error');
      resp = buildResponse(status.DATA_NOT_FOUND);
      res.status(resp.status).send(resp.body);
      await returnUpdate(resp);
      return;
    }

    // when enroll failed , flow is not continue
    if (statusEnroll == 'enroll_update_fail') {
      await returnUpdate(resp);
      return;
    }
    // send response 20000
    this.stat(appName+' returned '+nodeCmd+' '+'success');
    resp = buildResponse(status.SUCCESS);
    res.status(resp.status).send(resp.body);
    await this.waitFinished();

    this.debug('success update enroll and mongo transaction');
  } else {
    // send response 20000
    this.stat(appName+' returned '+nodeCmd+' '+'success');
    const resp = buildResponse(status.SUCCESS);
    res.status(resp.status).send(resp.body);
    await this.waitFinished();
  }

  const confStatusSrvOpt = {
    bodydata: {
      reference_id: mcTransaction.confirmCode || '',
      request_id: mcTransaction.request_id || '',
      aal: mcTransaction.min_aal || 1,
      ial: mcTransaction.min_ial || 1.1,
      status: (bodyDataServices.serviceResultCode === '20000') ?
              'accept' : 'reject',
      signature: mcTransaction.signature || '',
      resultcode: resultcodeNumber},
  };
  const accToken = await generateJWT();
  const headers = {
    'Content-Type': 'application/json',
    'X-Tid': initInvoke,
    'Authorization': 'Bearer ' + accToken,
  };
  const configNDID = JSON.parse(process.env.server);
  const url = (configNDID.use_https?'https':'http') +
        '://' + configNDID.app_host +
        (configNDID.app_port ? (':' + configNDID.app_port) : '') +
        '/idp/response';

  let statusIdp = '';

  if (bodyDataServices.serviceResultCode === '20000' ) {
    // send to response
    const cmdToNdid = 'idp_send_response_to_ndid';
    const serviceToNdid = 'ndid';
    const bodydataToIdp = {
      'reference_id': confStatusSrvOpt.bodydata.reference_id,
      'request_id': confStatusSrvOpt.bodydata.request_id,
      'callback_url': url,
      'aal': confStatusSrvOpt.bodydata.aal,
      'ial': confStatusSrvOpt.bodydata.ial,
      'status': confStatusSrvOpt.bodydata.status,
      'signature': confStatusSrvOpt.bodydata.signature,
      // 'accessor_id': '',
      //  'node_id': '',
    };
    const method = 'POST';
    const optionAttribut = {
      method: method,
      headers: headers,
      _service: serviceToNdid,
      _command: cmdToNdid,
      data: bodydataToIdp,
    };

    Object.assign(optionAttribut,
        {httpsAgent: createHttpsAgent(serviceToNdid, cmdToNdid)});

    const getResponse = await this.utils().http().request(optionAttribut);
    if (this.utils().http().isError(getResponse)) {
      // this.stat(appName+' returned '+nodeCmd+' system error');
      statusIdp = 'idp_response_fail';
    }
    if (getResponse.status != 202) {
      // eslint-disable-next-line max-len
      this.stat(appName+' recv '+serviceToNdid+' '+cmdToNdid+ ' error response');
      const errorDesc = (getResponse.data)?getResponse.data.error ||
      'error body is not found':
      'body is not found';
      this.summary().addErrorBlock(serviceToNdid, cmdToNdid,
          getResponse.status, errorDesc);

      statusIdp = 'idp_response_fail';
    } else {
      this.stat(appName+' recv '+serviceToNdid+' '+cmdToNdid + ' response');
      this.summary().addErrorBlock(serviceToNdid, cmdToNdid,
          getResponse.status, 'success');
      statusIdp = 'idp_response_success';
    }
  } else {
    // send to error response
    const bodydataToIdp = {
      'reference_id': confStatusSrvOpt.bodydata.reference_id,
      'request_id': confStatusSrvOpt.bodydata.request_id,
      'callback_url': url,
      'node_id': confStatusSrvOpt.bodydata.node_id,
      'error_code': confStatusSrvOpt.bodydata.resultcode,
      'urlCustom': 'serviceResponseModule',
      'callbackHandleURL': 'serviceResponseModule',
    };
    const errorRsp = await sendErrorResponse(bodydataToIdp);
    if (this.utils().http().isError(errorRsp)) {
      statusIdp = 'idp_error_response_fail';
    }
    if (errorRsp.status != 202) {
      statusIdp = 'idp_error_response_fail';
    } else {
      statusIdp = 'idp_error_response_success';
    }
  }
  // update last transaction
  const mongoAtrributeLastUpdate = {
    collection: collectionName.TRANSACTION,
    commandName: 'update_pidp_transaction',
    invoke: initInvoke,
    selector: {
      'requestReferenceId': bodydata.requestReferenceId,
    },
    update: {
      $set: {
        'status': statusIdp,
      },
    },
    options: {projection: {_id: 0}},
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  const updateResp = await mongoUpdate(this, mongoAtrributeLastUpdate);

  if (updateResp && updateResp == 'error') {
    // this.stat(appName+' returned '+nodeCmd+' '+'system error');
    resp = buildResponse(status.DB_ERROR);
    // res.status(resp.status).send();
    await returnUpdate(resp);
    return;
  }

  // document is not found
  if (updateResp.n == 0) {
    // /this.stat(appName+' returned '+nodeCmd+' '+'error');
    resp = buildResponse(status.DATA_NOT_FOUND);
    // res.status(resp.status).send();
    await returnUpdate(resp);
    return;
  }

  const response = buildResponse(status.SUCCESS);
  const resCode = response.body.resultCode;
  const resDesc = response.body.resultDescription ||
                      response.body.developerMessage;
  this.detail().end();
  this.summary().endASync(resCode, resDesc);
  // SEND CONFIRMED STATUS
  // const response = await sendConfirmedStatusService(this, confStatusSrvOpt);
  /*
  const confStatusSrvOpt = {
    bodydata: {
      reference_id: mcTransaction.confirmCode || '',
      request_id: mcTransaction.request_id || '',
      aal: mcTransaction.min_aal || 1,
      ial: mcTransaction.min_ial || 1.1,
      status: (bodyDataServices.serviceResultCode === '20000') ?
              'accept' : 'reject',
      signature: mcTransaction.signature || '',
      resultcode: resultcodeNumber},
  };

  const accToken = await generateJWT();
  const configNDID = JSON.parse(process.env.server);
  // const setting = require('../../../pm2-dev.json');
  // eslint-disable-next-line max-len
  // const configNDID = (setting.apps[0].env.server);
  const url = (configNDID.use_https?'https':'http') +
        '://' + configNDID.app_host +
        (configNDID.app_port ? (':' + configNDID.app_port) : '') +
        '/idp/response';

  const cmdToNdid = 'idp_send_response_to_ndid';
  const serviceToNdid = 'ndid';
  let bodydataToIdp = {
    'reference_id': confStatusSrvOpt.bodydata.reference_id,
    'request_id': confStatusSrvOpt.bodydata.request_id,
    'callback_url': url,
    'aal': confStatusSrvOpt.bodydata.aal,
    'ial': confStatusSrvOpt.bodydata.ial,
    'status': confStatusSrvOpt.bodydata.status,
    'signature': confStatusSrvOpt.bodydata.signature,
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
    bodydataToIdp = {
      'reference_id': confStatusSrvOpt.bodydata.reference_id,
      'request_id': confStatusSrvOpt.bodydata.request_id,
      'callback_url': url,
      'node_id': confStatusSrvOpt.bodydata.node_id,
      'error_code': confStatusSrvOpt.bodydata.resultcode,
    };
  }

  const method = 'POST';
  const optionAttribut = {
    method: method,
    headers: headers,
    _service: serviceToNdid,
    _command: cmdToNdid,
    data: bodydataToIdp,
  };

  Object.assign(optionAttribut,
      {httpsAgent: createHttpsAgent(serviceToNdid, cmdToNdid)});

  const getResponse = await this.utils().http().request(optionAttribut);
  // check http response
  if (this.utils().http().isError(getResponse)) {
    this.stat(appName+' returned '+nodeCmd+' system error');
    const response = buildResponse(status.SYSTEM_ERROR);
    const resCode = response.body.resultCode;
    const resDesc = response.body.resultDescription ||
                    response.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    await this.waitFinished();
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
    const resCode = response.body.resultCode;
    const resDesc = response.body.resultDescription ||
                    response.body.developerMessage;
    this.detail().end();
    this.summary().endASync(resCode, resDesc);
    await this.waitFinished();
    return;
  }

  this.stat(appName+' recv '+serviceToNdid+' '+cmdToNdid + ' response');
  this.summary().addErrorBlock(serviceToNdid, cmdToNdid,
      getResponse.status, 'success');

  const response = buildResponse(status.SUCCESS);
  const resCode = response.body.resultCode;
  const resDesc = response.body.resultDescription ||
                      response.body.developerMessage;

  // this.stat(appName+' returned '+nodeCmd+' '+'success');
  this.detail().end();
  this.summary().endASync(resCode, resDesc);
  await this.waitFinished();
  */
};
