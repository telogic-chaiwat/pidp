
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
const url = '/services/v1/identityServiceResponse';

const mock = new MockAdapter(axios);
const settings = JSON.parse(process.env.service);
const conf = settings.ndid.idp_send_response_to_ndid;
const urlIdp = conf.conn_type +'://' + conf.ip +
                    (conf.port ? (':' + conf.port) : '') + conf.path;

mock.onPost(urlIdp).reply(202);

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


describe('[1]GOOD FLOW for serviceResponse', ()=>{
  beforeEach(async () => {

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
    await mongoUtility.insert(collectionMongo.TRANSACTION, dataDummy.pidpTransactionData1);
  });

  test('[CASE 1] good case, everyting return ok', async () => {
    const res = await request(app).post(url)
        .set('Authorization', AuthTokenTest ) // set header for this test
        .set('Content-Type', 'application/json')
        .send(reqBody);

    // console.error(commonlog.summary().addBlock.mock.calls);
    // CHECK RESPONSE
    expect(res.status).toBe(200);
    // expect(JSON.parse(res.text)).toStrictEqual(OutRes);


    // CHECK MONGO

    const mongoDoc = await mongoUtility.findOne(collectionMongo.TRANSACTION, {'requestReferenceId': dataDummy.requestReferenceId1});
    // console.error(mongoDoc);
    expect(mongoDoc).toMatchObject(dataDummy.pidpTransactionData2);

    // CHECK SUMMARY

    const CMD = 'identity_service_response';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(4);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'find_pidp_transaction', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('mongo', 'update_pidp_transaction', '20000', 'success');
    expect(commonlog.summary().addBlock).toBeCalledWith('ndid', 'idp_send_response_to_ndid', 202, 'success');


    // CHECK STAT
    // console.error(commonlog.stat.mock.calls);
    expect(commonlog.stat).toHaveBeenCalledTimes(8);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.SUCCESS_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.SUCCESS_RETURN);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoFindPidpTransaction.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.SEND);
    expect(commonlog.stat).toBeCalledWith(stat.mongoUpdatePidpTransaction.RECEIVED_SUCCESS);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.SEND_RESPONSE_IDP);
    expect(commonlog.stat).toBeCalledWith(stat.serviceResponse.RECEIVED_SUCCESS_RESPONSE_IDP);
  });
});
