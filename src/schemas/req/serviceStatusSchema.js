const Joi = require('joi');
const {authorization, contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  'authorization': authorization,
});


const bodySchema = Joi.object({
  'requestReferenceId': Joi.string().optional(),
  'identifier': Joi.string().when('requestReferenceId', {
    not: Joi.exist(),
    then: Joi.required(),
  }),
  'requestId': Joi.string().when('requestReferenceId', {
    not: Joi.exist(),
    then: Joi.required(),
  }),
  'serviceId': Joi.string().when('requestReferenceId', {
    not: Joi.exist(),
    then: Joi.required(),
  }),
  'status': Joi.string().required().valid('as_completed','as_prepare_data','as_fail_get_data','as_send_data','as_fail_send_data','as_fail_data_not_found'),
});


module.exports = {
  headersSchema,
  bodySchema,
};
