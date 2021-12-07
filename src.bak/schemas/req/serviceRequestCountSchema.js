const Joi = require('joi');
const {authorization, contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  'authorization': authorization,
});


const bodySchema = Joi.object({
  'identityType': Joi.string().required(),
  'identityValue': Joi.string().required(),
});


module.exports = {
  headersSchema,
  bodySchema,
};
