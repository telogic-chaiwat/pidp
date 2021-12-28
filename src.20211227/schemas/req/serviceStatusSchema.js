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
  'status': Joi.string().required(),
});


module.exports = {
  headersSchema,
  bodySchema,
};
