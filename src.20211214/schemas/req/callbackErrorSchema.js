const Joi = require('joi');
const {contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  // 'authorization': authorization,
});


const bodySchema = Joi.object({
  'node_id': Joi.string().allow('').optional(),
  'type': Joi.string().allow('').valid('error').optional(),
  'action': Joi.string().allow('').optional(),
  'request_id': Joi.string().allow('').optional(),
  'error': Joi.object().keys({
    'code': Joi.number().optional(),
    'message': Joi.string().allow('').optional(),
  }).required(),
});


module.exports = {
  headersSchema,
  bodySchema,
};
