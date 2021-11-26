
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const stat = require('../../stat');
const _ = require('lodash');

const app = appTest;
const url = '/idp/request_status_update';

jest.setTimeout(100000);
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
  'timed_out': true,
};

const missingParam = [
  'node_id',
  'type',
  'request_id',
  'requester_node_id',
  'mode',
  'request_message_hash',
  'min_ial',
  'min_aal',
  'min_idp',
  'idp_id_list',
  'response_list',
  'data_request_list',
  'request_timeout',
  'closed',
  'status',
  'block_height',
  'timed_out',
  'response_list.[0].idp_id',
  'data_request_list.[0].service_id',
  'data_request_list.[0].min_as',
  'data_request_list.[0].as_id_list',
  'data_request_list.[0].request_params_hash',

];

describe('CALLBACK STATUS UPDATE  : missing case for mandatory parameter', ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await new Promise((r) => setTimeout(r, 2000));
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
    const CMD = 'callback_idp_request_status_update';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='request_id')?'':dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'missing='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
