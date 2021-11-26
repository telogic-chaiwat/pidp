module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.serviceRequestHistorySchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.serviceRequestHistorySchema.bodySchema');
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
  const getCustomerReferenceId = this.utils().services('basicFunction')
      .modules('getCustomerReferenceId');
  const getDateTime = this.utils().services('basicFunction')
      .modules('getDateTime');

  const appName = this.appName || 'pidp';
  // const serviceName = 'ndid';
  const nodeCmd = 'identityServiceHistory';
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
  const limit = req.body.limit || 20;
  const skip = req.body.start || 0;
  const query = [
    {
      '$match': {
        'namespace': req.body.identityType,
        'identifier': req.body.identityValue,
      },
    },
    {
      '$facet': {
        'result': [{$skip: skip}, {$limit: limit}],
        'totalCount': [{$count: 'count'}],
      },
    },
  ];
  const mongoOptAttribut = {
    collection: collectionName.IDENTITY_REQUEST,
    commandName: 'query_identity_request',
    invoke: initInvoke,
    query: query,
    max_retry: confMongo.max_retry,
    timeout: (confMongo.timeout*1000),
    retry_condition: confMongo.retry_condition,
  };

  const mongoResponse = await mongoAggregate(this, mongoOptAttribut);

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

  /* if (Array.isArray(mongoResponse) && mongoResponse[0] == 0) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND_200);
    res.status(resp.status).send(resp.body);
    return;
  }*/

  // const totalCount = 0;
  if (Array.isArray(mongoResponse) &&
        Array.isArray(mongoResponse[0].totalCount) &&
          mongoResponse[0].totalCount.length == 0 ) {
    this.stat(appName+' returned '+nodeCmd+' '+'error');
    const resp = buildResponse(status.DATA_NOT_FOUND);
    res.status(resp.status).send(resp.body);
    return;
  }
  const requestItem = [];
  for (let i = 0; i< mongoResponse[0].result.length; i++) {
    const buildReqItem = {};
    const record = mongoResponse[0].result[i];
    const nodeDetail = record.requester_node_detail;
    if (nodeDetail) {
      try {
        const ObjectNodeDetail = JSON.parse(nodeDetail);
        Object.assign(buildReqItem, {
          requester: ObjectNodeDetail.marketing_name_th,
        });
      } catch (err) {
        this.error('failed JSON parse requester node detail');
        Object.assign(buildReqItem, {
          requester: '',
        });
      }
    }

    Object.assign(buildReqItem, {
      'requesterInformation': record.request_message || '',
      'customerReferenceId': getCustomerReferenceId(record.request_message,
          record.request_id),
      'confirmCode': '',
      'RPLogoURL': '',
      'AAL': record.min_aal,
      'requestTime': getDateTime(record.creation_time),
      'expireTime': getDateTime(record.creation_time +
                              (record.request_timeout*1000)),
      'serviceStatus': (record.status)?record.status:'',
    });

    if (Array.isArray(record.data_request_list)) {
      const mapResult = record.data_request_list.map( (data) =>{
        return {
          'serviceName': data.service_id,
          'serviceOutputFormat': 'string',
        };
      });
      Object.assign(buildReqItem, {
        services: mapResult,
      });
    }
    requestItem.push(buildReqItem);
  }
  const resp = buildResponse(status.SUCCESS);
  Object.assign(resp.body, {
    resultData: [
      {
        'identityType': req.body.identityType,
        'identityValue': req.body.identityValue,
        'itemListProperty': {
          'count': Array.isArray(mongoResponse[0].result)?
                                  mongoResponse[0].result.length:0,
          'start': skip,
          'limit': limit,
          'total': mongoResponse[0].totalCount[0].count,
        },
        'requestItems': requestItem,
      },
    ],
  });
  res.status(resp.status).send(resp.body);
  this.stat(appName+' returned '+nodeCmd+' '+'success');
};


