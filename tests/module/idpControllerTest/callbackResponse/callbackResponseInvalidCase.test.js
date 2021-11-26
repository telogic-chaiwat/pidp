
/* eslint-disable max-len */
const request = require('supertest');
const commonlog = require('commonlog-kb');
const dataDummy = require('../../dataDummy');
const stat = require('../../stat');


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

const missingParam = [
  ['node_id', ' Object type', {}],
  ['node_id', ' Number type', 12],
  ['node_id', 'null value', null],
  ['node_id', ' blank string', ''],
  ['type', 'Wrong enum value', 'test'],
  ['type', ' Object type', {}],
  ['type', ' Number type', 12],
  ['type', 'null value', null],
  ['type', ' blank string', ''],
  ['reference_id', 'Object  type', {}],
  ['reference_id', ' Number type', 12],
  ['reference_id', 'null value', null],
  ['reference_id', ' blank string', ''],
  ['request_id', 'Object type', {}],
  ['request_id', ' Number type', 12],
  ['request_id', 'null value', null],
  ['request_id', ' blank string', ''],
  ['success', 'String type', 'test'],
  ['success', 'Object type', {}],
  ['success', ' Number type', 12],
  ['success', 'null value', null],
  ['success', ' blank string', ''],
];

describe('CALLBACK RESPONSE  : invalid case for mandatory parameter', ()=>{
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async ()=>{
    await new Promise((r) => setTimeout(r, 2000));
  });

  test.each(missingParam)('parameter : %s with %s', async (param, detail, value) => {
    jest.clearAllMocks();
    // delete missing parameter
    const backup = reqBody[param];
    reqBody[param] = value;
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
    const CMD = 'callback_idp_response';
    expect(commonlog.summary).toBeCalledWith(
        expect.anything(),
        expect.anything(), // invoke
        CMD, // cmd
        (param=='reference_id')?(value==null)?'':value:dataDummy.requestReferenceId1); // identity

    expect(commonlog.summary().addBlock).toHaveBeenCalledTimes(1);
    expect(commonlog.summary().addBlock).toBeCalledWith('client', CMD, null, 'invalid='+param);

    // CHECK STAT
    expect(commonlog.stat).toHaveBeenCalledTimes(2);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.BAD_RECEIVED);
    expect(commonlog.stat).toBeCalledWith(stat.callbackResponse.RETURN_ERROR);

    // undo delete
    reqBody[param] =backup;
  });
});
