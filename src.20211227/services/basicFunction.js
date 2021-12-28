/* eslint-disable max-len */

module.exports.buildNewSession = function(req, appName) {
  // return req.headers['x-tid'];
  let session = (req.headers['x-session-id'])?
        req.headers['x-session-id'] :'';
  session += ':';
    (req.headers['x-rtid'])?session+= req.headers['x-rtid']:'';
    session += ':';
    const initInvoke = generateXTid(appName);
    session+= initInvoke;
    return session;
};

module.exports.calculateTimeOut = {
  $add: ['$creation_time',
    {
      $subtract: [{$multiply: ['$request_timeout', 1000]}, 300*1000],
    },
  ],
};

const generateXTid = (nodeName) => {
  const totalLenght = 22;
  const dateFormat = require('dateformat');
  const now = new Date();
  const date = dateFormat(now, 'yymmdd');
  let commandId = nodeName + '-' + date;
  const remaininglength = totalLenght -commandId.length;
  commandId += randomstring(remaininglength);
  return commandId;
};

exports.generateXTid = generateXTid;

const randomstring = (index, appLog) => {
  const randomstring = require('randomstring');
  return randomstring.generate(index);
};

exports.generateRandomString = () =>{
  const length = Math.random() * (99 - 1) + 1;
  const randomstring = require('randomstring');
  const possibleValue = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return randomstring.generate({
    length: length,
    charset: possibleValue,
  });
};

exports.randomstringHex = () => {
  const randomstring = require('randomstring');
  return randomstring.generate({
    charset: 'hex',
  });
};

/**
 * the digits after REF: keyword in identity_request.request_message.
 * If not exists, then <first 4 ditgts of identity_request.request_id>
 * -xxx-<last 4 digits of identity_request.request_id>
 * @param {string} requestMessage
 * @param {string} requestId
 * @return {string}
 */
exports.getCustomerReferenceId = function getCustomerReferenceId(requestMessage, requestId) {
  // let result = requestId.substring(0, 4) + '-xxx-' +
  //               requestId.substring(requestId.length - 4);
  let result ='';
  if (requestMessage && typeof requestMessage == 'string' &&
     requestId && typeof requestId === 'string') {
    result = requestId.substring(requestId.length - 8);
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
  }
  return result;
};

exports.getDateTime = (value) =>{
  const dateFormat = require('dateformat');
  let result = '';
  if ( value && typeof value == 'number') {
    try {
      result = dateFormat(value, 'yyyy-mm-dd HH:MM:ss');
    } catch (err) {
      this.debug('error change format time');
    }
  }
  return result;
};
exports.loggingWhenWhitelist = function(req, res, options) {
  const onFinished = require('on-finished');
  const appName = 'pidp';
  const cmd = 'unknown';
  const identity = req.body.reference_id || '';
  const detail = req.rodSession.detail(req.invoke, cmd, identity);
  const summary = req.rodSession.summary(req.invoke, cmd, identity);
  let rawData = null;

  const logger = require('commonlog-kb');
  if (typeof logger.writeApplogIncoming=== 'function') {
    logger.writeApplogIncoming(this.req.sessionID, this.req);
  }

  if (detail.isRawDataEnabled()) {
    rawData = Object.keys(req.body).length === 0 ? null : JSON.stringify(req.body);
  }
  detail.addInputRequest('client', cmd, req.invoke,
      rawData,
      {
        Headers: req.headers,
        Url: req.url,
        QueryString: Object.keys(req.query).length === 0 ? null : req.query,
        Body: Object.keys(req.body).length === 0 ? null : req.body,
      },
      req.protocol, req.method);
  summary.addErrorBlock('pdip', cmd, null,
      'invalid=ip');
  req.rodSession.stat(appName+' received unknown_ip request');
  onFinished(res, function(err, res) {
    req.rodSession.stat(appName+' returned unknown_ip error');
    if ( detail ) {
      let rawData = null;
      if (detail.isRawDataEnabled() ) {
        if (res.body) {
          rawData = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
        }
      }
      detail.addOutputResponse('client', cmd, detail.InitInvoke,
          rawData,
          {
            Header: res.getHeaders(),
            Body: res.body || null,
          });

      if (typeof detail._async !== 'function' || detail._async()!==true) {
        try {
          detail.end();
        } catch (e) {
          req.rodSession.error(e);
        }
      }

      if (typeof logger.writeApplogOutgoing === 'function') {
        logger.writeApplogOutgoing(null, res);
      }
    }

    const summary = req.rodSession.summary();
    if ( summary && !summary.isEnd() && summary._async!==true ) {
      let responseResult = null;
      let responseDesc = null;
      if ( typeof res.body === 'object') {
        responseResult = res.body.resultCode;
        responseDesc = res.body.developerMessage;
      }
      req.rodSession.summary().end(responseResult, responseDesc);
    }

    if ( req.rodSession._cbWaitFinished ) {
      req.rodSession._cbWaitFinished();
    }
  });
};
