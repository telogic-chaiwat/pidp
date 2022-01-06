const Joi = require('joi');
const {authorization, contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  'authorization': authorization,
});


const bodySchema = Joi.object({
  'request_id': Joi.string().required(),
  'reference_id': Joi.string().required(),
  'ial': Joi.number().required(),
  'aal': Joi.number().required(),
  'status': Joi.string().required(),
  'signature': Joi.string().required(),
  'resultcode': Joi.number().required(),
});

module.exports = {
  headersSchema,
  bodySchema,
};
