
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const stat = require('../../stat');
const _ = require('lodash');
const mongoUtility = require('../../mongoUtility');
const {collectionMongo} = require('../../enum');
const app = appTest;
const url = '/services/v1/identityServiceRequest';

jest.setTimeout(100000);
const reqBody = {
  'identityType': dataDummy.nameSpace1,
  'identityValue': dataDummy.identifier1,
};

const missingParam = [
  'identityType',
  'identityValue',
];

describe('SERVICE RESPONSE : missing case for mandatory parameter', ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await new Promise((r) => setTimeout(r, 2000));
    await mongoUtility.connected();
  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.TRANSACTION);
    await mongoUtility.disconnected();
  });

  test.each(missingParam)('case missing paramter : %s', async (param) => {
    jest.clearAllMocks();
    // delete missing parameter
    const backup = _.get(reqBody, param);
    _.unset(reqBody, param);

    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // CHECK RESPONSE
    expect(res.status).toBe(403);
    expect(JSON.parse(res.text)).toStrictEqual({
      resultCode: '40300',
      developerMessage: 'missing_or_invalid_parameter',
    });

    // CHECK SUMMARY
    const CMD = 'identity_service_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='identityValue')?'':dataDummy.identifier1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'missing='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
