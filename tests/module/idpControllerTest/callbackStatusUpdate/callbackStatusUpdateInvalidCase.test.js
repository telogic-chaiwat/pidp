
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

const invalidParam = [
  ['node_id', 'null value', null],
  ['node_id', 'object value', {}],
  ['node_id', 'number value', 1234],
  ['node_id', 'empty string', ''],

  ['type', 'null value', null],
  ['type', 'object value', {}],
  ['type', 'number value', 1234],
  ['type', 'empty string', ''],

  ['request_id', 'null value', null],
  ['request_id', 'object value', {}],
  ['request_id', 'number value', 1234],
  ['request_id', 'empty string', ''],

  ['requester_node_id', 'null value', null],
  ['requester_node_id', 'object value', {}],
  ['requester_node_id', 'number value', 1234],
  ['requester_node_id', 'empty string', ''],

  ['mode', 'null value', null],
  ['mode', 'object value', {}],
  ['mode', 'wrong enum value', 4],
  ['mode', 'empty string', ''],

  ['request_message_hash', 'null value', null],
  ['request_message_hash', 'object value', {}],
  ['request_message_hash', 'number value', 1234],
  ['request_message_hash', 'empty string', ''],

  ['min_ial', 'null value', null],
  ['min_ial', 'object value', {}],
  ['min_ial', 'string value', 'abc'],
  ['min_ial', 'empty string', ''],

  ['min_aal', 'null value', null],
  ['min_aal', 'object value', {}],
  ['min_aal', 'string value', 'abc'],
  ['min_aal', 'empty string', ''],

  ['min_idp', 'null value', null],
  ['min_idp', 'object value', {}],
  ['min_idp', 'string value', 'abc'],
  ['min_idp', 'empty string', ''],

  ['idp_id_list', 'null value', null],
  ['idp_id_list', 'single object value', {}],
  ['idp_id_list', 'string value', 'abc'],
  ['idp_id_list', 'empty string', ''],

  ['response_list', 'null value', null],
  ['response_list', 'single object value', {}],
  ['response_list', 'string value', 'abc'],
  ['response_list', 'empty string', ''],

  ['data_request_list', 'null value', null],
  ['data_request_list', 'single object value', {}],
  ['data_request_list', 'string value', 'abc'],
  ['data_request_list', 'empty string', ''],

  ['request_timeout', 'null value', null],
  ['request_timeout', 'object value', {}],
  ['request_timeout', 'string value', 'abc'],
  ['request_timeout', 'empty string', ''],

  ['closed', 'null value', null],
  ['closed', 'object value', {}],
  ['closed', 'string value', 'abc'],
  ['closed', 'empty string', ''],
  ['closed', 'number string', 1234],

  ['status', 'null value', null],
  ['status', 'object value', {}],
  ['status', 'number value', 1234],
  ['status', 'empty string', ''],

  ['block_height', 'null value', null],
  ['block_height', 'object value', {}],
  ['block_height', 'number value', 1234],
  ['block_height', 'empty string', ''],

  ['timed_out', 'null value', null],
  ['timed_out', 'object value', {}],
  ['timed_out', 'string value', 'abc'],
  ['timed_out', 'empty string', ''],
  ['timed_out', 'number string', 1234],

  ['response_list.[0].idp_id', 'null value', null],
  ['response_list.[0].idp_id', 'object value', {}],
  ['response_list.[0].idp_id', 'number value', 1234],
  ['response_list.[0].idp_id', 'empty string', ''],

  ['data_request_list.[0].service_id', 'null value', null],
  ['data_request_list.[0].service_id', 'object value', {}],
  ['data_request_list.[0].service_id', 'number value', 1234],
  ['data_request_list.[0].service_id', 'empty string', ''],

  ['data_request_list.[0].min_as', 'null value', null],
  ['data_request_list.[0].min_as', 'single object value', {}],
  ['data_request_list.[0].min_as', 'string value', 'abc'],
  ['data_request_list.[0].min_as', 'empty string', ''],

  ['data_request_list.[0].as_id_list', 'null value', null],
  ['data_request_list.[0].as_id_list', 'single object value', {}],
  ['data_request_list.[0].as_id_list', 'string value', 'abc'],
  ['data_request_list.[0].as_id_list', 'empty string', ''],

  ['data_request_list.[0].request_params_hash', 'null value', null],
  ['data_request_list.[0].request_params_hash', 'object value', {}],
  ['data_request_list.[0].request_params_hash', 'number value', 1234],
  ['data_request_list.[0].request_params_hash', 'empty string', ''],

];

describe('CALLBACK STATUS UPDATE  : invalid case for mandatory parameter', ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await new Promise((r) => setTimeout(r, 2000));
  });

  test.each(invalidParam)('parameter : %s with %s', async (param, detail, value) => {
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
    const CMD = 'callback_idp_request_status_update';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='request_id')?(value == null)?'':value:dataDummy.requestId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'invalid='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackRequestStatusUpdate.RETURN_ERROR);

    // undo delete
    _.set(reqBody, param, backup);
  });
});
