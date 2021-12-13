const Joi = require('joi');
const {contentType} = require('../headers');

const dataRequestItemSchema = {
  service_id: Joi.string().required(),
  as_id_list: Joi.array().items(Joi.string().optional()).optional(),
  min_as: Joi.number().optional(),
};

const headersSchema = Joi.object({
  // 'authorization': authorization,
  'content-type': contentType.applicationJSON,
});

const bodySchema = Joi.object({
  node_id: Joi.string().required(),
  type: Joi.string().valid('incoming_request').required(),
  mode: Joi.number().valid(1, 2, 3).required(),
  request_id: Joi.string().required(),
  request_message: Joi.string().required(),
  request_message_hash: Joi.string().required(),
  request_message_salt: Joi.string().required(),
  requester_node_id: Joi.string().required(),
  min_ial: Joi.number().required(),
  min_aal: Joi.number().required(),
  request_timeout: Joi.number().required(),
  // eslint-disable-next-line max-len
  data_request_list: Joi.array().items(Joi.object(dataRequestItemSchema).optional()).optional().min(0),
  initial_salt: Joi.string().required(),
  creation_time: Joi.number().required(),
  creation_block_height: Joi.string().required(),
  request_timeout: Joi.number().required(),
  // requester_node_detail: Joi.string().required(),
  namespace: Joi.string().valid('citizen_id').optional(),
  identifier: Joi.string().length(13).optional(),
  reference_group_code: Joi.string().when('identifier', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
});

module.exports = {
  headersSchema,
  bodySchema,
};
