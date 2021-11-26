
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
  'node_id',
  'type',
  'request_id',
  'mode',
  'namespace',
  'identifier',
  'request_message',
  'request_message_hash',
  'request_message_salt',
  'requester_node_id',
  'min_ial',
  'min_aal',
  'initial_salt',
  'creation_time',
  'creation_block_height',
  'request_timeout',
  'data_request_list.[0].service_id',
];

describe('CALLBACK REQUEST : missing case for mandatory parameter', ()=>{
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
    const CMD = 'callback_pidp_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='request_id')?'':dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'missing='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
