const Joi = require('joi');
const {contentType} = require('../headers');

const headersSchema = Joi.object({
  'content-type': contentType.applicationJSON,
  // 'authorization': authorization,
});


const bodySchema = Joi.object({
  'node_id': Joi.string().required(),
  'type': Joi.string().valid('identity_modification_notification').required(),
  'reference_group_code': Joi.string().required(),
  'action': Joi.boolean().valid('create_identity',
      'revoke_identity_association', 'add_identity',
      'add_accessor', 'revoke_accessor', 'revoke_and_add_accessor',
      'upgrade_identity_mode').
      required(),
  'actor_node_id': Joi.string().required(),
  'identifier': Joi.string().required(),
});


module.exports = {
  headersSchema,
  bodySchema,
};
