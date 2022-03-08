const Joi = require('joi');
const {authorization, contentType} = require('../headers');

const servicesFields = Joi.object({
  'serviceName': Joi
      .string()
      .required(),

  'serviceResultCode': Joi
      .string()
      .required(),

  'serviceResultMessage': Joi
      .string()
      .required(),

  'serviceOutputFormat': Joi
      .string()
      .required(),

  'serviceOutputValue': Joi
      .string()
      .allow('')
      .allow(null),
});

const headersSchema = Joi.object({
  'authorization': authorization,
  'content-type': contentType.applicationJSON,
});

const bodySchema = Joi.object({
  'identityType': Joi
      .string()
      .required(),

  'identityValue': Joi
      .string()
      .required(),

  'channelName': Joi
      .string()
      .required(),

  'locationCode': Joi
      .string()
      .required(),

  'userId': Joi
      .string()
      .required(),

  'requestReferenceId': Joi
      .string()
      .required(),

  'requester': Joi
      .string().valid("AIS","ACI")
      .required(),

  'services': Joi
      .array()
      .items(servicesFields)
      .required(),
});

module.exports = {
  headersSchema,
  bodySchema,
};
