
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

  ['identityType', 'null value', null],
  ['identityType', 'object value', {}],
  ['identityType', 'number value', 1234],
  ['identityType', 'empty string', ''],

  ['identityValue', 'null value', null],
  ['identityValue', 'object value', {}],
  ['identityValue', 'number value', 1234],
  ['identityValue', 'empty string', ''],

  ['channelName', 'null value', null],
  ['channelName', 'object value', {}],
  ['channelName', 'number value', 1234],
  ['channelName', 'empty string', ''],

  ['locationCode', 'null value', null],
  ['locationCode', 'object value', {}],
  ['locationCode', 'number value', 1234],
  ['locationCode', 'empty string', ''],

  ['userId', 'null value', null],
  ['userId', 'object value', {}],
  ['userId', 'number value', 1234],
  ['userId', 'empty string', ''],

  ['requestReferenceId', 'null value', null],
  ['requestReferenceId', 'object value', {}],
  ['requestReferenceId', 'number value', 1234],
  ['requestReferenceId', 'empty string', ''],

  ['requester', 'null value', null],
  ['requester', 'object value', {}],
  ['requester', 'number value', 1234],
  ['requester', 'empty string', ''],

  ['services.[0].serviceName', 'null value', null],
  ['services.[0].serviceName', 'object value', {}],
  ['services.[0].serviceName', 'number value', 1234],
  ['services.[0].serviceName', 'empty string', ''],

  ['services.[0].serviceResultCode', 'null value', null],
  ['services.[0].serviceResultCode', 'object value', {}],
  ['services.[0].serviceResultCode', 'number value', 1234],
  ['services.[0].serviceResultCode', 'empty string', ''],

  ['services.[0].serviceResultMessage', 'null value', null],
  ['services.[0].serviceResultMessage', 'object value', {}],
  ['services.[0].serviceResultMessage', 'number value', 1234],
  ['services.[0].serviceResultMessage', 'empty string', ''],

  ['services.[0].serviceOutputFormat', 'null value', null],
  ['services.[0].serviceOutputFormat', 'object value', {}],
  ['services.[0].serviceOutputFormat', 'number value', 1234],
  ['services.[0].serviceOutputFormat', 'empty string', ''],

];

describe('SERVICE RESPONSE : invalid case for mandatory parameter', ()=>{
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

  test.each(missingParam)('parameter : %s with %s', async (param, detail, value) => {
    jest.clearAllMocks();
    // delete missing parameter
    const backup = _.get(reqBody, param);
    _.set(reqBody, param, value);

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
        (param=='requestReferenceId')?(value == null)?'':value:dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'invalid='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
