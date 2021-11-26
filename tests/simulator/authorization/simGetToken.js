/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable no-invalid-this */
const ObjectID = require('mongodb').ObjectID;

/**
 * @param {*} req  http request
 * @param {*} res  http response
 */
module.exports.getToken = async function(req, res) {
  const jwt = require('jsonwebtoken');
  const authConfig = require('../../../src/services/authConfig');
  const secretAccess = authConfig.secret_access;
  const secretRefresh = authConfig.secret_refresh;

  const mongoUpdate = require('./simMongoUtility').update;
  const status = require('../../../src/services/enum').status;
  const collectionName =require('../../../src/services/enum').collectionMongo;

  const conf = require('../../../pm2-sim.json').apps[0].env.service.authFunctions.authUser;

  const authUser = require('./simAuthFunctions').authUser;
  const buildResponse = require('./../../../src/submodules/buildResponse').buildResponse;


  const base64Credentials = req.headers.authorization.split(' ')[1];
  const credentials = Buffer
      .from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  /**
   * @param {response} res use to response
   * @return {response}
   */
  function handleSystemError(res) {
    response = buildResponse(status.SYSTEM_ERROR);
    return res.status(response.status).send(response.body);
  }

  /**
     *
     * @param {Object} res
     * @return {Response}
     */
  function handleDBError(res) {
    response = buildResponse(status.DB_ERROR);
    return res.status(response.status).send(response.body);
  }

  authUser(username, password, async (err, doc) => {
    if (err) {
      if (err === status.SYSTEM_ERROR) {
        return handleSystemError(res);
      } else if (err === status.DATA_NOT_FOUND) {

      } else if (err === status.ACCESS_DENIED) {

      } else if (err === status.DB_ERROR) {
        return handleDBError(res);
      } else {
        return handleSystemError(res);
      }
      response = buildResponse(err);
      return res.status(response.status).send(response.body);
    }

    const accessTokenExpired = +(conf.access_token_exp || '86400');
    const refreshTokenExpired = +(conf.refresh_token_exp || '172800');
    const accToken = jwt.sign({'id': doc._id, 'kind': 'access_token'},
        secretAccess, {expiresIn: accessTokenExpired});
    const refrToken = jwt.sign({'id': doc._id, 'kind': 'refresh_token'},
        secretRefresh, {expiresIn: refreshTokenExpired});
    const data = {
      $set: {
        accessToken: accToken,
        refreshToken: refrToken,
        login_at: new Date(),
      },
    };

    const updateResponse = await mongoUpdate(collectionName.CREDENTIAL,
        {'_id': ObjectID(doc._id)}, data);

    if (updateResponse && updateResponse === 'error') {
      return handleDBError(res);
    }

    response = {
      status: status.SUCCESS.HTTP_STATUS,
      body: {
        'resultCode': status.SUCCESS.RESULT_CODE,
        'developerMessage': status.SUCCESS.DEVELOPER_MESSAGE,
        'resultData': [
          {
            'tokenType': 'Bearer',
            'accessToken': accToken,
            'refreshToken': refrToken,
            'expiresIn': accessTokenExpired,
          },
        ],
      },
    };

    res.status(response.status).send(response.body);
  });
};

