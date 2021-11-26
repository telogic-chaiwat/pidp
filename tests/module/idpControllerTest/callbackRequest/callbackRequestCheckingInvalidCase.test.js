
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const stat = require('../../stat');
const _ = require('lodash');
const mongoUtility = require('../../mongoUtility');
const {collectionMongo} = require('../../enum');
const app = appTest;
const url = '/idp/request';

jest.setTimeout(100000);
const reqBody = {
  'node_id': '5GC7E7E4-3845-4801-9259-C81116ADB3B2',
  'type': 'incoming_request',
  'mode': 1,
  'request_id': dataDummy.requestId1,
  'request_message': 'Would you like to give Siam Comercial Bank your consent to send your information to Krung Thai Bank (REF: 61197)?',
  'request_message_hash': 'jH2WcsD9gdF+1++tMCcY5uNAtWAlUv4GjCeIx3iEIUY=',
  'request_message_salt': 'NL9eeesTLs/roA8GUXzVGA==',
  'requester_node_id': dataDummy.requesterNodeId1,
  'min_ial': 2.3,
  'min_aal': 2.2,
  'data_request_list': [
    {
      'service_id': '900.cust_info_Dipchip_001',
      'as_id_list': [
        '894CFA85-2AC5-4758-A86B-3E12B88F17DF',
      ],
      'min_as': 1,
    },
  ],
  'initial_salt': '0VUapcsKVMw2A5LKp2Ntbw==',
  'creation_time': 1594111476969,
  'creation_block_height': 'A02:179791',
  'request_timeout': 600,
  'namespace': 'citizen_id',
  'identifier': '1377777776879',
};

const missingParam = [
  ['node_id', 'null value', null],
  ['node_id', 'object value', {}],
  ['node_id', 'number value', 1234],
  ['node_id', 'empty string', ''],

  ['type', 'null value', null],
  ['type', 'object value', {}],
  ['type', 'number value', 1234],
  ['type', 'empty string', ''],
  ['type', 'wrong enum', 'test'],

  ['request_id', 'null value', null],
  ['request_id', 'object value', {}],
  ['request_id', 'number value', 1234],
  ['request_id', 'empty string', ''],

  ['mode', 'null value', null],
  ['mode', 'object value', {}],
  ['mode', 'wrong enum value', 4],
  ['mode', 'empty string', ''],

  ['namespace', 'null value', null],
  ['namespace', 'object value', {}],
  ['namespace', 'number value', 1234],
  ['namespace', 'empty string', ''],

  ['identifier', 'null value', null],
  ['identifier', 'object value', {}],
  ['identifier', 'number value', 1234],
  ['identifier', 'empty string', ''],

  ['request_message', 'null value', null],
  ['request_message', 'object value', {}],
  ['request_message', 'number value', 1234],
  ['request_message', 'empty string', ''],

  ['request_message_hash', 'null value', null],
  ['request_message_hash', 'object value', {}],
  ['request_message_hash', 'number value', 1234],
  ['request_message_hash', 'empty string', ''],

  ['request_message_salt', 'null value', null],
  ['request_message_salt', 'object value', {}],
  ['request_message_salt', 'number value', 1234],
  ['request_message_salt', 'empty string', ''],

  ['requester_node_id', 'null value', null],
  ['requester_node_id', 'object value', {}],
  ['requester_node_id', 'number value', 1234],
  ['requester_node_id', 'empty string', ''],

  ['min_ial', 'null value', null],
  ['min_ial', 'object value', {}],
  ['min_ial', 'string value', 'abc'],
  ['min_ial', 'empty string', ''],

  ['min_aal', 'null value', null],
  ['min_aal', 'object value', {}],
  ['min_aal', 'string value', 'abc'],
  ['min_aal', 'empty string', ''],

  ['initial_salt', 'null value', null],
  ['initial_salt', 'object value', {}],
  ['initial_salt', 'number value', 1234],
  ['initial_salt', 'empty string', ''],

  ['creation_time', 'null value', null],
  ['creation_time', 'object value', {}],
  ['creation_time', 'string value', 'abc'],
  ['creation_time', 'empty string', ''],

  ['creation_block_height', 'null value', null],
  ['creation_block_height', 'object value', {}],
  ['creation_block_height', 'number value', 1234],
  ['creation_block_height', 'empty string', ''],

  ['request_timeout', 'null value', null],
  ['request_timeout', 'object value', {}],
  ['request_timeout', 'string value', 'abc'],
  ['request_timeout', 'empty string', ''],

  ['data_request_list.[0].service_id', 'null value', null],
  ['data_request_list.[0].service_id', 'object value', {}],
  ['data_request_list.[0].service_id', 'number value', 1234],
  ['data_request_list.[0].service_id', 'empty string', ''],

];

describe('CALLBACK REQUEST : invalid case for mandatory parameter', ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await new Promise((r) => setTimeout(r, 2000));
    await mongoUtility.connected();
  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.IDENTITY_REQUEST);
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
    const CMD = 'callback_pidp_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='request_id')?(value == null)?'':value:dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'invalid='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
