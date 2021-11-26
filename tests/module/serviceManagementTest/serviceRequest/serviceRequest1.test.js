
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const mongoUtility = require('../../mongoUtility');
const stat = require('../../stat');
const {collectionMongo} = require('../../enum');

const app = appTest;
const url = '/services/v1/identityServiceRequest';

const randomstring = require('randomstring');

const reqBody = {
  'identityType': dataDummy.nameSpace1,
  'identityValue': dataDummy.identifier1,
};

const OutRes = {
  'resultCode': '20000',
  'developerMessage': 'success',
  'resultData': [
    {
      'identityType': dataDummy.nameSpace1,
      'identityValue': dataDummy.identifier1,
      'requestItems': [
        {
          'requestReferenceId': '123456789',
          'requesterInformation': 'Would you like to give Siam Comercial Bank your consent to send your information to Krung Thai Bank',
          'customerReferenceId': '61197',
          'services': [
            {
              'serviceName': '900.cust_info_Dipchip_001',
              'serviceOutputFormat': 'string',
            },
          ],
          'confirmCode': '123456789',
        },
      ],
    },
  ],
};

describe('[1]GOOD FLOW for serviceRequest', ()=>{
  beforeEach(async () => {

  });

  afterAll(async () =>{
    await mongoUtility.drop(collectionMongo.IDENTITY_REQUEST);
    // await mongoUtility.drop(collectionMongo.TRANSACTION);
    await mongoUtility.disconnected();
    jest.spyOn(randomstring, 'generate').mockRestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    jest.spyOn(randomstring, 'generate').mockReturnValue('123456789');
    await mongoUtility.connected();
    await mongoUtility.insert(collectionMongo.IDENTITY_REQUEST, dataDummy.identityRequestData1);
  });

  test('[CASE 1] good case, everyting return ok', async () => {
    const MockDate = require('mockdate');
    MockDate.set('2021-08-15T15:38:20.696Z');
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // console.error(commonlog.summary().addBlock.mock.calls);
    // CHECK RESPONSE
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toStrictEqual(OutRes);


    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.TRANSACTION, {});
    // console.error(mongoDoc);
    expect(mongoDoc).toMatchObject(dataDummy.pidpTransactionData1);

    // CHECK SUMMARY

    const CMD = 'identity_service_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.identifier1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(3);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_identity_request', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'insert_pidp_transaction', '20000', 'success');


    // CHECK STAT

    expect(commonlog.stat).toHaveBeenCalledTimes(6);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoInsertPidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoInsertPidpTransaction.RECEIVED_SUCCESS);
  });

  test('[CASE 2] identity request is not found', async () => {
    await mongoUtility.drop(collectionMongo.IDENTITY_REQUEST);
    const MockDate = require('mockdate');
    MockDate.set('2021-08-15T15:38:20.696Z');
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // console.error(commonlog.summary().addBlock.mock.calls);
    // CHECK RESPONSE
    expect(res.status).toBe(404);
    expect((res.text)).toStrictEqual('');


    // CHECK MONGO
    const mongoDoc = await mongoUtility.findOne(collectionMongo.IDENTITY_REQUEST, {});
    // console.error(mongoDoc);
    expect(mongoDoc).toBeNull();

    // CHECK SUMMARY

    const CMD = 'identity_service_request';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.identifier1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(2);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_identity_request', '40401', 'data not found');

    // CHECK STAT

    expect(commonlog.stat).toHaveBeenCalledTimes(4);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceRequest.RETURN_ERROR);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindIdpRequest.RECEIVED_SUCCESS);
  });
});
