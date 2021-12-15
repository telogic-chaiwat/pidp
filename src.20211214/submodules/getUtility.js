module.exports.getUtility = async function(body) {
  const createHttpsAgent = this.utils().submodules('createHttpsAgent')
      .modules('createHttpsAgent');
  const generateXTid = this.utils().services('basicFunction')
      .modules('generateXTid');
  const generateJWT = this.utils().submodules('generateJWT')
      .modules('generateJWT');
  // const randomstringHex = this.utils().services('basicFunction')
  //    .modules('randomstringHex');

  const appName = this.appName || 'pidp';
  const accToken = await generateJWT();
  let headers = {
    'Content-Type': 'application/json',
    'X-Tid': generateXTid('pidp'),
    'Authorization': 'Bearer ' + accToken,
  };

  if (body.headers) {
    headers = body.headers;
  }
  // SEND TO UTILITY
  const utilityNodeName = 'ndid_utility_nodes';
  const utlityServiceName = 'ndid';
  const confUtilityNode = this.utils().services('ndid')
      .conf(utilityNodeName);

  const nodeID = (body.requester_node_id)?body.requester_node_id:body.node_id;
  const urlUtility = confUtilityNode.conn_type +'://' + confUtilityNode.ip +
          (confUtilityNode.port ? (':' + confUtilityNode.port) : '') +
          confUtilityNode.path + nodeID;

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
    return responseUtility;
  }
  if (responseUtility.status != 200 && responseUtility.status != 202 ) {
    // eslint-disable-next-line max-len
    const errorDesc = (responseUtility.status==404)?'not found':
            (responseUtility.data)?responseUtility.data.error:
            'body data is not found';
    this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+
            ' error response');
    this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
        responseUtility.status, errorDesc);

    return responseUtility;
  }

  if (!(responseUtility.data && responseUtility.data.node_name)) {
    this.debug('[GET UTILITY] cannot find data.nodename');
    this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+
        ' bad response');
    this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
        responseUtility.status, 'bad response');
    await returnError();
    return responseUtility;
  }

  this.stat(appName+' recv '+utlityServiceName+' '+utilityNodeName+' response');
  this.summary().addErrorBlock(utlityServiceName, utilityNodeName,
      responseUtility.status, 'success');
  return responseUtility;
};


