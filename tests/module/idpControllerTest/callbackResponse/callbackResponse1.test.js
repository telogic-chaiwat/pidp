
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const mongoUtility = require('../../mongoUtility');
const stat = require('../../stat');
const {collectionMongo} = require('../../enum');

const app = appTest;
const url = '/idp/response';

jest.setTimeout(100000);
const reqBody = {
  'node_id': ' 894CFA85-2AC5-4758-A86B-3E12B88F17DF ',
  'type': 'response_result',
  'reference_id': dataDummy.requestReferenceId1,
  'request_id': dataDummy.requestId1,
  'success': true,
  'error': {
    'code': 0,
    'message': 'sda',
  },
};

describe('[1]GOOD FLOW for IDP Controller callbackResponse', ()=>{
  beforeEach(async () => {
    await mongoUtility.deleteOne(collectionMongo.TRANSACTION, {
      requestReferenceId: dataDummy.requestReferenceId1,
    });
    dataDummy.pidpTransactionData2.status = 'confirmed';
    await mongoUtility.insert(collectionMongo.TRANSACTION, dataDummy.pidpTransactionData2);
  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.TRANSACTION);
    await mongoUtility.disconnected();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await mongoUtility.connected();
    // await mongoUtility.insert(collectionMongo.TRANSACTION, dataDummy.pidpTransactionData2);
  });

  test('[CASE 1] with confirmed = status and success = true', async () => {
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // console.error(commonlog.summary().addBlock.mock.calls);
    // CHECK RESPONSE
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.TRANSACTION, {request_id: dataDummy.requestId1});
    dataDummy.pidpTransactionData2.status = 'wait_for_as';
    expect(mongoDoc).toMatchObject(dataDummy.pidpTransactionData2);

    // CHECK SUMMARY
    const CMD = 'callback_idp_response';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(3);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_pidp_transaction', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_pidp_transaction', '20000', 'success');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(6);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.RECEIVED_SUCCESS);
  });

  test('[CASE 2] with confirmed = status and success = false', async () => {
    reqBody.success = false;
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // console.error(commonlog.summary().addBlock.mock.calls);
    // CHECK RESPONSE
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.TRANSACTION, {request_id: dataDummy.requestId1});
    dataDummy.pidpTransactionData2.status = 'confirmed_fail';
    expect(mongoDoc).toMatchObject(dataDummy.pidpTransactionData2);

    // CHECK SUMMARY
    const CMD = 'callback_idp_response';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(3);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_pidp_transaction', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_pidp_transaction', '20000', 'success');

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(6);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.RECEIVED_SUCCESS);
  });
});
