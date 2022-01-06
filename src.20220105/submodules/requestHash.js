module.exports.requestHash = async function(body) {
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');
  // const generateJWT = this.utils().submodules('generateJWT')
  //    .modules('generateJWT');
    // const randomstringHex = this.utils().services('basicFunction')
    //    .modules('randomstringHex');

  const appName = this.appName || 'pidp';
  // const accToken = await generateJWT();
  let headers = {
    'Content-Type': 'application/json',
  //  'Authorization': 'Bearer ' + accToken,
  };

  if (body.headers) {
    headers = body.headers;
  }
  // SEND TO REQUEST HASH
  const utilityNodeName = 'ndid_request_hash';
  const utlityServiceName = 'ndid';

  const params = {
    node_id: body.params.node_id,
    request_id: body.params.request_id,
    accessor_id: body.params.accessor_id,
  };
  // const nodeID =(body.requester_node_id)?body.requester_node_id:body.node_id;
  // const urlUtility = confUtilityNode.conn_type +'://' + confUtilityNode.ip +
  //          (confUtilityNode.port ? (':' + confUtilityNode.port) : '') +
  //          confUtilityNode.path + nodeID;

  const method = 'GET';
  const optionAttributUtility = {
    method: method,
    headers: headers,
    _service: utlityServiceName,
    _command: utilityNodeName,
    params: params,
  };
  Object.assign(optionAttributUtility,
      {httpsAgent: createHttpsAgent(utlityServiceName, utilityNodeName)});

  const responseUtility = await this.utils().http().
      request(optionAttributUtility);

  if (this.utils().http().isError(responseUtility)) {
    return responseUtility;
  }
  if (responseUtility.status != 200 && responseUtility.status != 202 ) {
    // eslint-disable-next-line max-len
    const errorDesc = (responseUtility.status==404)?'not found':
              (responseUtility.data)?responseUtility.data.error.message:
              'body data is not found';
    this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+
              ' error response');
    this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
        responseUtility.status, errorDesc);

    return responseUtility;
  }


  this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+' response');
  this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
      responseUtility.status, 'success');
  return responseUtility;
};


