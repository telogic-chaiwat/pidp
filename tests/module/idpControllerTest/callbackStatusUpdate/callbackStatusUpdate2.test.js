
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const mongoUtility = require('../../mongoUtility');
const stat = require('../../stat');
const {collectionMongo} = require('../../enum');

const app = appTest;
const url = '/idp/request_status_update';


const reqBody = {
  'node_id': 'string',
  'type': 'request_status',
  'request_id': dataDummy.requestId1,
  'requester_node_id': 'testing 1',
  'mode': 1,
  'request_message_hash': 'testing 1',
  'min_ial': 1.1,
  'min_aal': 1,
  'min_idp': 0,
  'idp_id_list': [
    'string',
  ],
  'response_list': [
    {
      'ial': 2.3,
      'aal': 2.2,
      'status': 'reject',
      'signature': 'test',
      'idp_id': '3BB7E7E4-3845-4801-9259-C81116ADB3B1',
      'valid_ial': null,
      'valid_signature': null,
    },
  ],
  'data_request_list': [
    {
      'service_id': 'string',
      'as_id_list': [
        'string',
      ],
      'min_as': 0,
      'request_params_hash': 'string',
      'response_list': [
        {
          'as_id': 'string',
          'signed': true,
          'received_data': true,
          'error_code': 0,
        },
      ],
    },
  ],
  'request_timeout': 0,
  'closed': true,
  'status': 'pending',
  'block_height': 'string',
};

describe('[2]DATA NOT FOUND FLOW for callbackStatusUpdate', ()=>{
  beforeEach(async () => {

  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.IDENTITY_REQUEST);
    await mongoUtility.drop(collectionMongo.TRANSACTION);
    await mongoUtility.disconnected();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await mongoUtility.connected();
  });

  test('[CASE 1] idp_identity is NOT FOUND', async () => {
    Object.assign(reqBody, {
      'timed_out': false,
    });
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // CHECK RESPONSE
    expect(res.status).toBe(404);
    expect(res.text).toBe('');

    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.IDENTITY_REQUEST, {request_id: dataDummy.requestId1});
    expect(mongoDoc).toBeNull();

    // CHECK SUMMARY
    const CMD = 'callback_idp_request_status_update';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(2);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_identity_request', '40401', 'data not found');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(4);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.RETURN_ERROR);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.RECEIVED_SUCCESS);
  });

  test('[CASE 2] pidp_transaction is NOT FOUND', async () => {
    reqBody.timed_out = true;
    await mongoUtility.insert(collectionMongo.IDENTITY_REQUEST, dataDummy.identityRequestData1);
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // CHECK RESPONSE
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.TRANSACTION, {request_id: dataDummy.requestId1});
    expect(mongoDoc).toBeNull();

    // CHECK SUMMARY
    const CMD = 'callback_idp_request_status_update';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(3);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_identity_request', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_pidp_transaction', '40401', 'data not found');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(6);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdateIdpRequest.RECEIVED_SUCCESS);
  });
});
