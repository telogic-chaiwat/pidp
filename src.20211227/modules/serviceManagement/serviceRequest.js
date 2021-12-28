module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.serviceRequestSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.serviceRequestSchema.bodySchema');
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
  const mongoFind = this.utils().services('mongoFunction').
      modules('find');
  const mongoInsert = this.utils().services('mongoFunction')
      .modules('insert');
  const mongoUpdate = this.utils().services('mongoFunction')
      .modules('update');
  const collectionName = this.utils().services('enum')
      .modules('collectionMongo');
  const confMongo = this.utils().services('mongo')
      .conf('default');
  const getDateTime = this.utils().services('basicFunction')
      .modules('getDateTime');
  const timeoutFilter = this.utils().submodules('timeoutFilter')
      .modules('timeoutFilter');
  const randomstring = require('randomstring');
  const enrollchecking = this.utils().submodules('checkEnroll')
      .modules('checkEnroll');
  const requestHash = this.utils().submodules('requestHash')
      .modules('requestHash');
  const createSign = this.utils().submodules('createSign')
      .modules('createSign');

  const randomstringHex = () => {
    return randomstring.generate({
      charset: 'hex',
    });
  };

  const randomstringConfirmCode = () => {
    return randomstring.generate({
      charset: 'numeric',
      length: 8,
    });
  };
  const appName = this.appName || 'pidp';
  const nodeCmd = 'identityServiceRequest';
  const bodydata = req.body || {};
  const identity = bodydata.identityValue || '';
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

  // success validation input
  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock('client', nodeCmd, null, 'success');

  const initInvoke = this.detail().InitInvoke || '';
  this.debug('generate XTid ' + initInvoke);

  /* const currentTime = new Date().getTime();
  const calculateTimeOut = {
    $add: ['$creation_time',
      {
        $subtract: [{$multiply: ['$request_timeout', 1000]}, 300*1000],
      },
    ],
  };
*/
  const query = {
    'namespace': bodydata.identityType,
    'identifier': bodydata.identityValue,
    'closed': {$ne: true},
    'timed_out': {$ne: true},
    '$or': [
      {'status': null}, {status: 'pending'},
    ],
    'request_timeout': {
      $gte: 300,
    },
    // '$expr': {
    //  $lte: [currentTime, calculateTimeOut],
    // },
  };

  let mongoOptAttribut = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'query_identity_request',
    invoke: initInvoke,
    query: query,
    options: {projection: {_id: 0}},
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  let mongoResponse = await mongoFind(this, mongoOptAttribut);

  if (mongoResponse && mongoResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.DB_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }
  if (Array.isArray(mongoResponse) == false) {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.SYSTEM_ERROR);
    res.status(resp.status).send();
    return;
  }
  mongoResponse = timeoutFilter(mongoResponse);
  if (Array.isArray(mongoResponse) && mongoResponse.length == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND_200);
    res.status(resp.status).send(resp.body);
    return;
  }
  // NEW REQ CHECK MODE AND ACCESSOR ID
  let doc = { };
  const docs = [];
  const docTransaction = [];
  let services = [];
  let service = {};
  const timeOutArray = [];

  // mongoResponse.forEach((record) => {
  for (let i = 0; i< mongoResponse.length; i++) {
    const record = mongoResponse[i];

    let accessorId = null;
    let signResult = null;
    if (record.mode > 1) {
      let accessorKey = null;
      let messagePadded = null;
      //let signResult = null;
      // if accessor_id is not available
      if (!(record.accessor_id)) {
        this.debug('accessor_id is not found do enrollment check');
        const paramToEnroll = {
          'id_card': record.identifier,
        };
        const respEnrollCheck = await enrollchecking(async ()=>{
          return;
        }, paramToEnroll);

        if (this.utils().http().isError(respEnrollCheck)) {
          this.stat(appName+' returned '+nodeCmd+' '+'system error');
          const resp = buildResponse(status.DB_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
        if (respEnrollCheck.status == 200 && respEnrollCheck.data &&
          respEnrollCheck.data.resultCode == '20020') {
          this.stat(appName+' returned '+nodeCmd+' '+' error');
          const resp = buildResponse(status.DATA_NOT_FOUND_200);
          res.status(resp.status).send(resp.body);
          return;
        }

        if (respEnrollCheck.status == 200 && respEnrollCheck.data &&
          respEnrollCheck.data.resultData) {
          accessorId = respEnrollCheck.data.resultData[0].accessor_id;
          accessorKey = respEnrollCheck.data.resultData[0].accessor_private_key;
        }
      } else {
        accessorId = record.accessor_id;
        accessorKey = record.accessor_private_key ||
                        record.onboard_accessor_private_key;
      }
      // if request_message_padded is not available
      if (!(record.request_message_padded)) {
        this.debug('request_message_padded is not found do Request HASH');
        const body = {
          params: {
            accessor_id: accessorId,
            request_id: record.request_id,
          },
        };
        const respReqHash = await requestHash(body);

        if (this.utils().http().isError(respReqHash)) {
          this.stat(appName+' returned '+nodeCmd+' '+'system error');
          const resp = buildResponse(status.DB_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
        if (respReqHash.status != 200) {
          this.stat(appName+' returned '+nodeCmd+' '+' error');
          const resp = buildResponse(status.SYSTEM_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
        messagePadded = respReqHash.data.request_message_padded_hash;
      }
      if (accessorId && messagePadded) {
        try {
          signResult = createSign(accessorKey, messagePadded);
        } catch (err) {
          this.stat(appName+' returned '+nodeCmd+' '+' error');
          const resp = buildResponse(status.SYSTEM_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
      }
      if (signResult) {
        mongoOptAttribut = {
          collection: collectionName.IDENTITY_REQUEST,
          commandName: 'update_identity_request',
          invoke: initInvoke,
          selector: {'request_id': record.request_id},
          update: {
            $set: {
              'request_message_padded_hash': messagePadded,
              'signature': signResult,
	      'accessor_id' : accessorId,
	      'accessor_private_key' : accessorKey,
            },
          },
          max_retry: confMongo.max_retry,
          timeout: (confMongo.timeout*1000),
          retry_condition: 'CONNECTION_ERROR|TIMEOUT',
        };
        const respMongoUpdate = await mongoUpdate(this, mongoOptAttribut);

        if (respMongoUpdate == 'error') {
          this.stat(appName+' returned '+nodeCmd+' '+'system error');
          const resp = buildResponse(status.DB_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
        if (respMongoUpdate.n && respMongoUpdate.n == 0) {
          this.stat(appName+' returned '+nodeCmd+' '+'system error');
          const resp = buildResponse(status.DB_ERROR);
          res.status(resp.status).send(resp.body);
          return;
        }
      }
    }

    let reqNodeDetail = null;
    try {
      reqNodeDetail = (record.requester_node_detail) ?
      JSON.parse(record.requester_node_detail) : null;
    } catch (error) {
      this.debug('error parsing requester_node_detail value ' +
      record.requester_node_detail);
    }

    let serviceName = 'verify';
    if (record.data_request_list &&
      Array.isArray(record.data_request_list)&&
      record.data_request_list[0]) {
      serviceName = (record.data_request_list[0].service_id)?
              record.data_request_list[0].service_id: 'verify';
    }
    if (serviceName == 'verify') {
      if (record.data_request_list && Array.isArray(record.data_request_list)) {
        record.data_request_list.push({
          service_id: serviceName,
        });
      } else {
        Object.assign(record, {
          data_request_list: [
            {
              service_id: serviceName,
            },
          ],
        });
      }
    }
    doc = {
      requestReferenceId: randomstringHex(),
      request_id: record.request_id || null,
      customerReferenceId: getCustomerReferenceId(record.request_message,
          record.request_id),
      citizen_id: record.identifier || null,
      requester: (reqNodeDetail) ? reqNodeDetail.marketing_name_th : null,
      serviceName: serviceName,
      min_aal: record.min_aal || null,
      min_ial: record.min_ial || null,
      request_at: new Date(),
      status: 'pending',
      timeout: false,
      signature: record.signature || signResult || null,
      requesterInformation: getReqInformation(record.request_message),
      requester_node_id: record.requester_node_id || null,
      creation_time: record.creation_time || null,
      confirmCode: randomstringConfirmCode(),
    };

    removeEmptyField(doc);

    if (record.mode > 1) {
      if (accessorId) {
        Object.assign(doc, {
          'accessor_id': accessorId,
          'mode': record.mode,
          'signature': record.signature || signResult,
        });
      }
    }

    if (record.data_request_list && Array.isArray(record.data_request_list)) {
      record.data_request_list.forEach((dataRequest) => {
        service['serviceName'] = dataRequest.service_id;
        service['serviceOutputFormat'] = 'string';
        services.push(service);
      });
      service = {};
    };

    docTransaction.push({...doc});
    doc['services'] = services;
    services = [];
    docs.push(doc);
    timeOutArray.push(record.request_timeout);
  }
  // });

  mongoOptAttribut = {
    collection: collectionName.TRANSACTION,
    commandName: 'insert_pidp_transaction',
    invoke: initInvoke,
    doc: docTransaction,
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  mongoResponse = await mongoInsert(this, mongoOptAttribut);

  if (mongoResponse && mongoResponse == 'error') {
    this.stat(appName+' returned '+nodeCmd+' '+'system error');
    const resp = buildResponse(status.DB_ERROR);
    res.status(resp.status).send(resp.body);
    return;
  }

  // Make body response, requestItems fields and append to resultData field
  const requestItems = [];
  for (let i = 0; i < docs.length; i++) {
    requestItems.push({
      'requestReferenceId': docs[i].requestReferenceId || null,
      'requester': docs[i].requester || null,
      'requesterInformation': docs[i].requesterInformation || '',
      'customerReferenceId': docs[i].customerReferenceId || null,
      'services': (docs[i].services.length) ? docs[i].services : null,
      'confirmCode': docs[i].confirmCode || null,
      'RPLogoURL': '-',
      'AAL': docs[i].min_aal,
      'requestTime': getDateTime(docs[i].creation_time),
      'expireTime': getDateTime(docs[i].creation_time +
                      (timeOutArray[i]*1000)),
      'services': docs[i].services,
    });

    removeEmptyField(requestItems[i]);
  }

  const resp = buildResponse(status.SUCCESS);

  Object.assign(resp.body, {
    resultData: [
      {
        identityType: bodydata.identityType,
        identityValue: bodydata.identityValue,
        requestItems: requestItems,
      },
    ]});

  this.stat(appName+' returned '+nodeCmd+' '+'success');
  res.status(resp.status).send(resp.body);
};

/**
 * the digits after REF: keyword in identity_request.request_message.
 * If not exists, then <first 4 ditgts of identity_request.request_id>
 * -xxx-<last 4 digits of identity_request.request_id>
 * @param {string} requestMessage
 * @param {string} requestId
 * @return {string}
 */
function getCustomerReferenceId(requestMessage, requestId) {
  // let result = requestId.substring(0, 4) + '-xxx-' +
  //               requestId.substring(requestId.length - 4);
  let result = requestId.substring(requestId.length - 8);
  // const regexPattern = /(REF\:)(\s*)(\d)/g;
  const regexPattern = /(\bREF\:|\bRef\:|\bref\:)/g;
  if (requestMessage && requestMessage !== '' &&
        new RegExp(regexPattern, 'g').test(requestMessage)) {
    const patternWord = requestMessage.match(regexPattern);
    const startIndex = requestMessage.lastIndexOf(
        patternWord[patternWord.length-1]);
    const substr = requestMessage.substring(startIndex);
    const endIndex = substr.indexOf(')');
    const refId = (endIndex>=0)?substr.substring(0, endIndex):substr;
    result = refId.replace(regexPattern, '').trim();
    // result = (result.length > 7) ? result.substring(0, 7): result;
    // result = (result.length >= 8) ? result.substring(0, 8): result;
  }

  return result;
}

/**
 * the message before "(REF: XXXX )" keyword  in
 * ndid.identity_request.request_message
 * @param {string} reqMessage
 * @return {string}
 */
function getReqInformation(reqMessage) {
  // const reqMsg = reqMessage;
  // const regexPattern = /\s\((REF\:)(\s*)(\d{0,})\).+/g;
  // if (!reqMsg) return null;
  // return reqMsg.replace(regexPattern, '');
  let requestMessage = reqMessage;
  const regexPattern = /(\bREF\:|\bRef\:|\bref\:)/g;
  if (requestMessage && requestMessage !== '' &&
        new RegExp(regexPattern, 'g').test(requestMessage)) {
    const patternWord = requestMessage.match(regexPattern);
    const lastIndex = requestMessage.lastIndexOf(
        patternWord[patternWord.length-1]);
    // lastIndex decrement with 1 to remove "(" or just remove white space
    requestMessage = requestMessage.substring(0, lastIndex-1).trim();
  }
  return requestMessage;
}

/**
 *  remove field not define and value of null
 * @param {Object} obj
 */
function removeEmptyField(obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (value == null || value === '') {
      if (key !='requesterInformation') {
        delete obj[key];
      }
    };
  }
}
