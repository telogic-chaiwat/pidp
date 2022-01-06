const Joi = require('joi');
const {authorization, contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  'authorization': authorization,
});


const bodySchema = Joi.object({
  'identityType': Joi.string().required(),
  'identityValue': Joi.string().required(),
  'start': Joi.number().optional().default(0),
  'limit': Joi.number().optional().default(20),
  'year_month': Joi.string().optional(),
});


module.exports = {
  headersSchema,
  bodySchema,
};
