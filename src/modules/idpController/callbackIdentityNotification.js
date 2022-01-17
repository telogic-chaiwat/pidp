/* eslint-disable max-len */
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
    node_id: req.body.actor_node_id,
  };
  const response = await getUtility(body);

  if (typeof response != 'string' && response.status &&
        response.status == 200) {
    const callback = async function(msisdns) {
      const messageCreate = this.utils().app().const('notification_create');
      const messageRevoke = this.utils().app().const('notification_revoke');
      let message = 'sent notification';

      if (req.body.action == 'create_identity') {
        message = messageCreate;
      } else if (req.body.action == 'revoke_identity_association') {
        message = messageRevoke;
      }
      // eslint-disable-next-line require-jsdoc
      function replaceAll(string, search, replace) {
        return string.split(search).join(replace);
      }

      if (response.data && response.data.node_name) {
        try {
          const objNodeName = JSON.parse(response.data.node_name);
          if (objNodeName && objNodeName.marketing_name_th) {
            // eslint-disable-next-line max-len
            message = replaceAll(message, '[marketing_name_th]', objNodeName.marketing_name_th);
          } else {
            this.debug('[callbackIdentityNotification] marketing_name_th is not found');
          }
        } catch (err) {
          // eslint-disable-next-line max-len
          this.debug('[callbackIdentityNotification] Error While parse node_name');
          this.debug(err.message);
        }
      } else {
        this.debug('[callbackIdentityNotification] node_name is not found');
      }
      await sendNoti(msisdns, message);
    };

    const enrollBody = {};
    if (req.body.identifier) {
      Object.assign(enrollBody, {
        'id_card': req.body.identifier,
      });
    } else if (req.body.reference_group_code) {
      Object.assign(enrollBody, {
        'reference_group_code': req.body.reference_group_code,
      });
    }
    if (response.data && response.data.node_name) {
      await checkEnroll(callback, enrollBody);
    }
  }
  this.detail().end();
  this.summary().endASync();
};


