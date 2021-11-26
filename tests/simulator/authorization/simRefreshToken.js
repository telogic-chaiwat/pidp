/* eslint-disable max-len */
/* eslint-disable no-invalid-this */
const ObjectID = require('mongodb').ObjectID;

module.exports.NAME = async function(req, res) {
  const jwt = require('jsonwebtoken');
  const authConfig = require('../../../src/services/authConfig');
  const secretAccess = authConfig.secret_access;
  const secretRefresh = authConfig.secret_refresh;

  const mongoUpdate = require('./simMongoUtility').update;
  const status = require('../../../src/services/enum').status;
  const collectionName =require('../../../src/services/enum').collectionMongo;

  const conf = require('../../../pm2-sim.json').apps[0].env.service.authFunctions.authUser;
  const authTokens = require('./simAuthFunctions').authTokens;
  const buildResponse = require('./../../../src/submodules/buildResponse').buildResponse;


  let response;

  const refreshToken = req.body.refreshToken;
  const authorization = req.headers.authorization;

  /**
   * @param {*} res response
   * @return {response} response http
   */
  function handleSystemError(res) {
    response = buildResponse(status.SYSTEM_ERROR);
    return res.status(response.status).send(response.body);
  }

  /**
   * @param {*} res  response
   */
  function handleDBError() {

  }
  /**
   * @param {response} res use to response
   * @return {response}
   */
  function handleUpdateError(res) {
    handleDBError();
    response = buildResponse(status.DB_UPDATE_ERROR);
    return res.status(response.status).send(response.body);
  }

  const {verifyRefreshToken} = require('./simAuthFunctions');
  const validate = verifyRefreshToken(req.body.refreshToken);
  console.log(validate);
  if (validate.error) {
    if (validate.error === 'invalid' ) {
      handleSystemError();
    }
    handleSystemError();
  }
  const decoded = validate.decoded;

  let accessToken;
  try {
    accessToken = authorization.split(' ')[1];
  } catch (error) {
    console.log('split authorization error ' + error);
  }

  authTokens(accessToken, refreshToken, decoded.id, async (err, doc) => {
    if (err) {
      if (err === status.DB_ERROR) {
        handleDBError();
      } else if (err == status.DATA_NOT_FOUND) {

      } else {
        return handleSystemError(res);
      }

      response = buildResponse(err);
      return res.status(response.status).send(response.body);
    } else {
      const accessTokenExpired =
                  +(conf.access_token_exp || '86400');
      const refreshTokenExpired =
                  +(conf.refresh_token_exp || '172800');
      const accToken = jwt.sign({'id': doc._id,
        'kind': 'access_token'},
      secretAccess, {expiresIn: accessTokenExpired});
      const refrToken = jwt.sign({'id': doc._id,
        'kind': 'refresh_token'}, secretRefresh,
      {expiresIn: refreshTokenExpired});
      // this.summary()
      //    .addSuccessBlock(nodeName, cmdDetail, null, 'success');

      const data = {
        $set: {
          accessToken: accToken,
          refreshToken: refrToken,
          refresh_at: new Date(),
        },
      };

      const updateResponse =
                await mongoUpdate(collectionName.CREDENTIAL,
                    {'_id': new ObjectID(doc._id)},
                    data);

      if (updateResponse && updateResponse === 'error') {
        console.log('error on update');
        return handleUpdateError(res);
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
    }
  });
};
