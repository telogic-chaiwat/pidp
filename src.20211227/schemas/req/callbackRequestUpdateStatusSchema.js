const Joi = require('joi');
const {contentType} = require('../headers');

/*
const serviceListSchema = {
  service_id: Joi.string().required(),
  min_as: Joi.number().required(),
  signed_data_count: Joi.number().optional(),
  received_data_count: Joi.number().optional(),
};

const responseValidListSchema = {
  idp_id: Joi.string().allow('').optional(),
  valid_signature: Joi.boolean().optional(),
  valid_ial: Joi.boolean().optional(),
};
*/
const dataRequestListSchema = {
  service_id: Joi.string().required(),
  as_id_list: Joi.array().items(Joi.string()).required(),
  min_as: Joi.number().required(),
  request_params_hash: Joi.string().required(),
  response_list: Joi.array().items(Joi.object({
    as_id: Joi.string().optional(),
    signed: Joi.boolean().optional(),
    received_data: Joi.boolean().optional(),
    error_code: Joi.number().optional(),

  })).optional(),
};

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  // 'authorization': authorization,
});

const bodySchema = Joi.object({
  node_id: Joi.string().required(),
  type: Joi.string().valid('request_status').required(),
  request_id: Joi.string().required(),
  requester_node_id: Joi.string().required(),
  mode: Joi.number().valid(1, 2, 3).required(),
  request_message_hash: Joi.string().required(),
  min_ial: Joi.number().required(),
  min_aal: Joi.number().required(),
  min_idp: Joi.number().required(),
  idp_id_list: Joi.array().items(Joi.string()).required(),
  response_list: Joi.array().items(Joi.object({
    ial: Joi.number().optional(),
    aal: Joi.number().optional(),
    status: Joi.string().valid('accept', 'reject').optional(),
    error_code: Joi.number().optional(),
    signature: Joi.string().optional(),
    idp_id: Joi.string().required(),
    valid_signature: Joi.boolean().allow(null).optional(),
    valid_ial: Joi.boolean().allow(null).optional(),
  })).required(),
  // eslint-disable-next-line max-len
  data_request_list: Joi.array().items(Joi.object(dataRequestListSchema)).required(),
  request_timeout: Joi.number().required(),
  // answered_idp_count: Joi.number().optional(),
  closed: Joi.boolean().required(),
  timed_out: Joi.boolean().required(),
  status: Joi.string().required(),
  // eslint-disable-next-line max-len
  // service_list: Joi.array().items(Joi.object(serviceListSchema)).required(),
  // eslint-disable-next-line max-len
  // response_valid_list: Joi.array().items(Joi.object(responseValidListSchema)).required(),
  block_height: Joi.string().required(),
});

module.exports = {
  headersSchema,
  bodySchema,
};
