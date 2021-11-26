
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const stat = require('../../stat');
const _ = require('lodash');
const mongoUtility = require('../../mongoUtility');
const {collectionMongo} = require('../../enum');
const app = appTest;
const url = '/services/v1/identityServiceResponse';

jest.setTimeout(100000);
const reqBody = {
  'identityType': dataDummy.nameSpace1,
  'identityValue': dataDummy.identifier1,
  'channelName': 'AIS Shop',
  'locationCode': 'Central Rama 9',
  'userId': 'userA',
  'requestReferenceId': dataDummy.requestReferenceId1,
  'requester': 'Mock 1',
  'services': [
    {
      'serviceName': '900.cust_info_Dipchip_001',
      'serviceResultCode': '20000',
      'serviceResultMessage': 'success',
      'serviceOutputFormat': 'string',
      'serviceOutputValue': '{"card_number":"1234567890123"}',
    },
  ],
};

const missingParam = [
  'identityType',
  'identityValue',
  'channelName',
  'locationCode',
  'userId',
  'requestReferenceId',
  'requester',
  'services.[0].serviceName',
  'services.[0].serviceResultCode',
  'services.[0].serviceResultMessage',
  'services.[0].serviceOutputFormat',
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
    const CMD = 'identity_service_response';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='requestReferenceId')?'':dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'missing='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
