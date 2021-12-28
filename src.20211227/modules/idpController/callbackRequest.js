module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.callbackRequestSchemas.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.callbackRequestSchemas.bodySchema');
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
  const mongoFindOne = this.utils().services('mongoFunction')
      .modules('findOne');
  const mongoInsert = this.utils().services('mongoFunction')
      .modules('insert');
  const mongoUpdate = this.utils().services('mongoFunction')
      .modules('update');
  const generateJWT = this.utils().submodules('generateJWT')
      .modules('generateJWT');
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');
  const collectionName = this.utils().services('enum')
      .modules('collectionMongo');
  const confMongo = this.utils().services('mongo')
      .conf('default');
  const enrollchecking = this.utils().submodules('checkEnroll')
      .modules('checkEnroll');
  const checkDipChip = this.utils().submodules('checkDipChip')
      .modules('checkDipChip');
  const getDipChipFlag = this.utils().submodules('checkDipChip')
      .modules('getDipChipFlag');
  const sendErrorResponse = this.utils().submodules('errorResponse')
      .modules('sendErrorResponse');
  const sendsms = this.utils().submodules('sendSMSFromMyId')
      .modules('send');

  // init detail and summary log
  const appName = this.appName || 'pidp';
  const nodeCmd = 'callback_idp_request';
  const identity = req.body.request_id || '';
  const initInvoke = req.invoke;
  this.commonLogAsync(req, nodeCmd, identity);

  const returnError = async (statusRes=status.SYSTEM_ERROR) =>{
    if (statusRes == status.SYSTEM_ERROR) {
      this.stat(appName+' returned '+nodeCmd+' '+'system error');
    } else {
      this.stat(appName+' returned '+nodeCmd+' '+'error');
    }
    const resp = buildResponse(statusRes);
    if (res.writableFinished == false) {
      res.status(resp.status).send();
      await this.waitFinished();
    }

    this.detail().end();
    this.summary().endASync();
    return;
  };

  const sendErrorCallback = async ()=>{
    const dataIdpErrorResponse = {
      'reference_id': '',
      'request_id': req.body.request_id,
      'node_id': req.body.node_id,
      'error_code': 30300,
      'urlCustom': 'callbackRequestModule',
      'callbackHandleURL': 'callbackRequestModule',
    };

    await sendErrorResponse(dataIdpErrorResponse);
  };

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema,
      'content-type');
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send();
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync();
    return;
  }

  /* responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync();
    return;
  }
*/
  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send();
    await this.waitFinished();
    this.detail().end();
    this.summary().endASync();
    return;
  }

  // success validation input
  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');

  const optionAttribut = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'find_identity_request',
    invoke: initInvoke,
    query: {'request_id': req.body.request_id},
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition || 'CONNECTION_ERROR|TIMEOUT',
  };

  const getResponse = await mongoFindOne(this, optionAttribut);
  if (getResponse && getResponse == 'error') {
    await returnError(status.SYSTEM_ERROR);
    return;
  }

  if (!(getResponse)) { // NOT FOUND
    // insert
    const optionAttributInsert = {
      collection: collectionName.IDENTITY_REQUEST,
      commandName: 'insert_identity_request',
      invoke: initInvoke,
      doc: req.body,
      max_retry: confMongo.max_retry,
      timeout: (confMongo.timeout*1000),
      retry_condition: confMongo.retry_condition || 'CONNECTION_ERROR|TIMEOUT',

    };
    const insertResponse = await mongoInsert(this, optionAttributInsert);
    if (insertResponse && insertResponse == 'error') {
      // error while insert
      await returnError(status.SYSTEM_ERROR);
      return;
    }
  } else { // FOUND
    returnError(status.SYSTEM_ERROR);
    return;
  }
  // SEND RESPONSE TO CLIENT 204
  // this.stat(appName+' returned '+nodeCmd+' '+'success');
  res.status(204).send();
  await this.waitFinished();

  const accToken = await generateJWT();
  const headers = {
    'Content-Type': 'application/json',
    'X-Tid': initInvoke,
    'Authorization': 'Bearer ' + accToken,
  };

  // SEND TO UTILITY
  const utilityNodeName = 'ndid_utility_nodes';
  const utlityServiceName = 'ndid';
  const confUtilityNode = this.utils().services('ndid')
      .conf(utilityNodeName);

  const urlUtility = confUtilityNode.conn_type +'://' + confUtilityNode.ip +
      (confUtilityNode.port ? (':' + confUtilityNode.port) : '') +
      confUtilityNode.path + req.body.requester_node_id;

  const method = 'GET';
  const optionAttributUtility = {
    method: method,
    headers: headers,
    _service: utlityServiceName,
    _command: utilityNodeName,
    url: urlUtility,
  };
  Object.assign(optionAttributUtility,
      {httpsAgent: createHttpsAgent(utlityServiceName, utilityNodeName)});

  const responseUtility = await this.utils().http().
      request(optionAttributUtility);

  if (this.utils().http().isError(responseUtility)) {
    await returnError();
    return;
  }
  if (responseUtility.status != 200) {
    // eslint-disable-next-line max-len
    const errorDesc = (responseUtility.status==404)?'not found':
        (responseUtility.data)?responseUtility.data.error:
        'body data is not found';
    this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+
        ' error response');
    this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
        responseUtility.status, errorDesc);
    await returnError();
    return;
  }

  if (!(responseUtility.data && responseUtility.data.node_name)) {
    this.debug(' cannot find data.nodename');
    this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+
    ' bad response');
    this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
        responseUtility.status, 'bad response');
    await returnError();
    return;
  }

  this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+' response');
  this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
      responseUtility.status, 'success');

  const optionAttributMongo = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'update_identity_request',
    invoke: initInvoke,
    selector: {'request_id': req.body.request_id},
    update: {
      $set: {
        'requester_node_detail': responseUtility.data.node_name,
      },
    },
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: 'CONNECTION_ERROR|TIMEOUT',
  };

  let marketing_name_th="";
  let node_obj=JSON.parse(responseUtility.data.node_name);
  if(node_obj) marketing_name_th=node_obj.marketing_name_th;
  let smsContent='คุณได้รับคำขอยืนยันตัวตน และขอความยินยอมในการใช้ข้อมูลของคุณในการยืนยันตัวตนกับ AIS/AWN กรุณาตรวจสอบให้แน่ชัดว่าเป็นการสมัครใช้บริการของคุณ ก่อน Log-in เข้า myAIS App เพื่อยืนยันตัวตนการเปิดบัญชี '+marketing_name_th;

  const mongoResponse = await mongoUpdate(this, optionAttributMongo);
  if (mongoResponse && mongoResponse == 'error') {
    await returnError(status.SYSTEM_ERROR);
    return;
  }
  // data not found
  if (mongoResponse.n && mongoResponse.n == 0) {
    await returnError(status.DATA_NOT_FOUND);
    return;
  }
  // REQ : ONLY MODE : 1 will send SIGN
  if (req.body.mode == 1) {
    const signNodeName = 'ndid_sign';
    const signServiceName = 'ndid';
    const confSignNode = this.utils().services('ndid')
        .conf(signNodeName);

    const bodydataSign = {
      node_id: req.body.node_id,
      request_message: req.body.request_message,
      request_message_hash: req.body.request_message_hash,
      hash_method: confSignNode.hash_method,
      key_type: confSignNode.key_type,
      sign_method: confSignNode.sign_method,
    };
    const optionAttributSign = {
      method: 'POST',
      headers: headers,
      _service: signServiceName,
      _command: signNodeName,
      data: bodydataSign,
    };
    Object.assign(optionAttributSign,
        {httpsAgent: createHttpsAgent(signServiceName, signNodeName)});

    const responseSign = await this.utils().http().request(optionAttributSign);
    if (this.utils().http().isError(responseSign)) {
      await returnError(status.SYSTEM_ERROR);
      return;
    }

    if (responseSign.status != 200) {
    // eslint-disable-next-line max-len
      const errorDesc = (responseSign.status==404)?'not found':
        (responseSign.data)?responseSign.data.error:'body data is not found';
      this.stat(appName+' recv '+signServiceName+' '+signNodeName+
        ' error response');
      this.summary().addErrorBlock(signServiceName, signNodeName,
          responseSign.status, errorDesc);
      await returnError(status.SYSTEM_ERROR);
      return;
    }

    this.stat(appName+' recv '+signServiceName+' '+signNodeName+' response');
    this.summary().addErrorBlock(signServiceName, signNodeName,
        responseSign.status, 'success');

    const optionAttributMongoSign = {
      collection: collectionName.IDENTITY_REQUEST,
      commandName: 'update_identity_request',
      invoke: initInvoke,
      selector: {'request_id': req.body.request_id},
      update: {
        $set: {
          'signature': responseSign.data.signature,
        },
      },
      max_retry: confMongo.max_retry,
      timeout: (confMongo.timeout*1000),
      retry_condition: 'CONNECTION_ERROR|TIMEOUT',
    };
    const mongoResponseSign = await mongoUpdate(this, optionAttributMongoSign);
    if (mongoResponseSign && mongoResponseSign == 'error') {
      await returnError(status.SYSTEM_ERROR);
      return;
    }
    // data not found
    if (mongoResponseSign.n && mongoResponseSign.n == 0) {
      await returnError(status.DATA_NOT_FOUND);
      return;
    }
  }

  // new requierment to check enroll and Dipchip (myid) 18-10-2021
  // new CR use reference_group_code if identifier is not available
  const paramForEnroll = {};
  let callbackEnroll = async (msisdn)=>{
    await sendsms(msisdn,smsContent);
  };

  if (this.req.body.identifier) {
    Object.assign(paramForEnroll, {
      'id_card': this.req.body.identifier,
    });
  } else {
    Object.assign(paramForEnroll, {
      'reference_group_code': this.req.body.reference_group_code,
    });
    callbackEnroll = async (msisdn, idCard)=>{
      const optionMongo = {
        collection: collectionName.IDENTITY_REQUEST,
        commandName: 'update_identity_request',
        invoke: initInvoke,
        selector: {'request_id': req.body.request_id},
        update: {
          $set: {
            'namespace': 'citizen_id',
            'identifier': idCard,
          },
        },
        max_retry: confMongo.max_retry,
        timeout: (confMongo.timeout*1000),
        retry_condition: 'CONNECTION_ERROR|TIMEOUT',
      };
      const mongoUpdateRes = await mongoUpdate(this, optionMongo);
      if (mongoUpdateRes && mongoUpdateRes == 'error') {
        await sendErrorCallback.call(this);
        return;
      }
      // data not found
      if (mongoUpdateRes.n && mongoUpdateRes.n == 0) {
        await sendErrorCallback.call(this);
        return;
      }

      await sendsms(msisdn,smsContent);
    };
  }
  const resEnroll = await enrollchecking(callbackEnroll, paramForEnroll);

  if (typeof resEnroll != 'string' && resEnroll.data &&
        resEnroll.data.resultCode == '20020' && resEnroll.status == 200) {
    // if identifer is available
    if (this.req.body.identifier) {
      const respDipChip = await checkDipChip();
      if ((typeof respDipChip != 'string' && respDipChip.status &&
                respDipChip.status == 404) ||
                getDipChipFlag(respDipChip) == 'N'
      ) {
        await sendErrorCallback.call(this);
      }
    } else {
      await sendErrorCallback.call(this);
    }
  }

  this.stat(appName+' returned '+nodeCmd+' '+'success');
  this.detail().end();
  this.summary().endASync();
};
