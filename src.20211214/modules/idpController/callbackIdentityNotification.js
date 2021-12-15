module.exports.NAME = async function(req, res, next) {
  const headersReqSchema = this.utils().
      schemas('req.callbackIdentityNotificationSchema.headersSchema');
  const bodyReqSchema = this.utils().
      schemas('req.callbackIdentityNotificationSchema.bodySchema');
  // const validateToken = this.utils().submodules('validateToken').
  //    modules('validateToken');
  const validateHeader = this.utils().submodules('validateHeader').
      modules('validateHeader');
  const validateBody = this.utils().submodules('validateBody').
      modules('validateBody');
  const getUtility = this.utils().submodules('getUtility').
      modules('getUtility');
  const checkEnroll = this.utils().submodules('checkEnroll').
      modules('checkEnroll');
  const sendNoti = this.utils().submodules('sendNotification').
      modules('sends');
  const status = this.utils().services('enum').
      modules('status');
  const buildResponse = this.utils().submodules('buildResponse')
      .modules('buildResponse');

  const appName = this.appName || 'pidp';
  const serviceName = 'ndid';
  const nodeCmd = 'callback_idp_identity_notification';
  const identity = req.body.reference_id || '';

  this.commonLogAsync(req, nodeCmd, identity);

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
  /*
  responseError = await validateToken(appName, nodeCmd);
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

  this.stat(appName+' received '+nodeCmd+' request');
  this.summary().addSuccessBlock(serviceName, nodeCmd, null, 'success');

  res.status(204).send();
  await this.waitFinished();
  this.stat(appName+' returned '+nodeCmd+' '+'success');

  // new REQ 21-10-2021
  // SEND TO UTILITY

  const body = {
    node_id: req.body.node_id,
  };
  const response = await getUtility(body);

  if (typeof response != 'string' && response.status &&
        response.status == 200) {
    if (response.data && response.data.node_name) {
      await checkEnroll(sendNoti, {
        'id_card': req.body.identifier,
      });
    }
  }
  this.detail().end();
  this.summary().endASync();
};


