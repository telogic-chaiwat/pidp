module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.CallbackIDPResponseNoDipChipSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.CallbackIDPResponseNoDipChipSchema.bodySchema');
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
  const appName = this.appName || 'pidp';
  const serviceName = 'ndid';
  const nodeCmd = 'callback_idp_response_reject';
  const identity = req.body.reference_id || '';

  this.commonLog(req, nodeCmd, identity);

  let responseError = await validateHeader(appName, nodeCmd, headersReqSchema,
      'content-type');
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send(responseError.body);
    return;
  }
  /*
  responseError = await validateToken(appName, nodeCmd);
  if (responseError) {
    res.status(responseError.status).send(responseError.body);
    return;
  }
*/
  responseError = await validateBody(appName, nodeCmd, bodyReqSchema);
  if (responseError) {
    const response = buildResponse(status.BAD_REQUEST);
    res.status(response.status).send();
    return;
  }

  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock(serviceName, nodeCmd, null, 'success');

  res.status(204).send();
  this.stat(appName+' returned '+nodeCmd+' '+'success');
};


