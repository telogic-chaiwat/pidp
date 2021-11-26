
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const mongoUtility = require('../../mongoUtility');
const stat = require('../../stat');
const {collectionMongo} = require('../../enum');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const app = appTest;
const url = '/idp/request';

const mock = new MockAdapter(axios);
const settings = JSON.parse(process.env.service);
const confUtilityNode = settings.ndid.ndid_utility_nodes;
const utitityUrl = confUtilityNode.conn_type +'://' + confUtilityNode.ip +
                    (confUtilityNode.port ? (':' + confUtilityNode.port) : '') + confUtilityNode.path + dataDummy.requesterNodeId1;

const confSign = settings.ndid.ndid_sign;
const signUrl = confSign.conn_type +'://' + confSign.ip +
                    (confSign.port ? (':' + confSign.port) : '') + confSign.path;

mock.onGet(utitityUrl).reply(200, {
  node_name: dataDummy.requesterNodeDetail2,
});

mock.onPost(signUrl).reply(200, {
  signature: dataDummy.signature2,
});

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

describe('[1]GOOD FLOW for callbackRequest', ()=>{
  beforeEach(async () => {

  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.IDENTITY_REQUEST);
    await mongoUtility.disconnected();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await mongoUtility.connected();
  });

  test('[CASE 1] good case, everyting return ok', async () => {
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    await new Promise((r) => setTimeout(r, 2000));

    // CHECK RESPONSE
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    // CHECK MONGO

    Object.assign(reqBody, {
      signature: dataDummy.signature2,
      requester_node_detail: dataDummy.requesterNodeDetail2,
    });
    const mongoDoc = await mongoUtility.findOne(collectionMongo.IDENTITY_REQUEST, {request_id: dataDummy.requestId1});
    // console.error(mongoDoc);
    expect(mongoDoc).toMatchObject(reqBody);

    // CHECK SUMMARY
    const CMD = 'callback_pidp_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(7);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_identity_request', '40401', 'data not found');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'insert_identity_request', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('ndid', 'ndid_utility_nodes', 200, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_identity_request', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('ndid', 'ndid_sign', 200, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_identity_request', '20000', 'success');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(14);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoInsertIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoInsertIdpRequest.RECEIVED_SUCCESS);

    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.SEND_UTILITY);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.RECEIVED_SUCCESS_UTILITY);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.RECEIVED_SUCCESS);

    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.SEND_SIGN);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.RECEIVED_SUCCESS_SIGN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.RECEIVED_SUCCESS);
  });

  test('[CASE 2] good case, data exist', async () => {
    delete reqBody.signature;
    delete reqBody.requester_node_detail;
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    await new Promise((r) => setTimeout(r, 2000));

    // CHECK RESPONSE
    expect(res.status).toBe(403);
    // expect(res.text).toBe('');

    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.IDENTITY_REQUEST, {request_id: dataDummy.requestId1});
    // console.error(mongoDoc);
    expect(mongoDoc).toMatchObject(reqBody);

    // CHECK SUMMARY
    const CMD = 'callback_pidp_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(2);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_identity_request', '20000', 'success');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(4);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequest.RETURN_ERROR);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.RECEIVED_SUCCESS);
  });
});
