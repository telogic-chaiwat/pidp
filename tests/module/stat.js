/* eslint-disable max-len */
module.exports = Object.freeze({

  'callbackRequest': {
    SUCCESS_RECEIVED: 'publicIdp received callback_pidp_request request',
    BAD_RECEIVED: 'publicIdp received bad callback_pidp_request request',
    SYSTEM_ERROR: 'publicIdp returned callback_pidp_request system error',
    RETURN_ERROR: 'publicIdp returned callback_pidp_request error',
    SUCCESS_RETURN: 'publicIdp returned callback_pidp_request success',
    SEND_UTILITY: 'publicIdp sent ndid ndid_utility_nodes request',
    RECEIVED_SUCCESS_UTILITY: 'publicIdp recv ndid ndid_utility_nodes response',
    RECEIVED_ERROR_UTILITY: 'publicIdp recv ndid ndid_utility_nodes error response',
    SEND_SIGN: 'publicIdp sent ndid ndid_utility_nodes request',
    RECEIVED_SUCCESS_SIGN: 'publicIdp recv ndid ndid_sign response',
    RECEIVED_ERROR_SIGN: 'publicIdp recv ndid ndid_sign error response',
  },

  'callbackRequestStatusUpdate': {
    SUCCESS_RECEIVED: 'publicIdp received callback_idp_request_status_update request',
    BAD_RECEIVED: 'publicIdp received bad callback_idp_request_status_update request',
    SYSTEM_ERROR: 'publicIdp returned callback_idp_request_status_update system error',
    RETURN_ERROR: 'publicIdp returned callback_idp_request_status_update error',
    SUCCESS_RETURN: 'publicIdp returned callback_idp_request_status_update success',
  },

  'callbackResponse': {
    SUCCESS_RECEIVED: 'publicIdp received callback_idp_response request',
    BAD_RECEIVED: 'publicIdp received bad callback_idp_response request',
    SYSTEM_ERROR: 'publicIdp returned callback_idp_response system error',
    RETURN_ERROR: 'publicIdp returned callback_idp_response error',
    SUCCESS_RETURN: 'publicIdp returned callback_idp_response success',
  },
  'serviceRequest': {
    SUCCESS_RECEIVED: 'publicIdp received identity_service_request request',
    BAD_RECEIVED: 'publicIdp received bad identity_service_request request',
    SYSTEM_ERROR: 'publicIdp returned identity_service_request system error',
    RETURN_ERROR: 'publicIdp returned identity_service_request error',
    SUCCESS_RETURN: 'publicIdp returned identity_service_request success',
  },
  'serviceResponse': {
    SUCCESS_RECEIVED: 'publicIdp received identity_service_response request',
    BAD_RECEIVED: 'publicIdp received bad identity_service_response request',
    SYSTEM_ERROR: 'publicIdp returned identity_service_response system error',
    RETURN_ERROR: 'publicIdp returned identity_service_response error',
    SUCCESS_RETURN: 'publicIdp returned identity_service_response success',
    SEND_RESPONSE_IDP: 'publicIdp sent ndid idp_send_response_to_ndid request',
    RECEIVED_SUCCESS_RESPONSE_IDP: 'publicIdp recv ndid idp_send_response_to_ndid response',
    RECEIVED_ERROR_RESPONSE_IDP: 'publicIdp recv ndid idp_send_response_to_ndid error response',
  },

  'mongoFindIdpRequest': {
    SEND: 'publicIdp sent mongo find_identity_request request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo find_identity_request response',
  },

  'mongoInsertIdpRequest': {
    SEND: 'publicIdp sent mongo insert_identity_request request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo insert_identity_request response',
  },

  'mongoUpdateIdpRequest': {
    SEND: 'publicIdp sent mongo update_identity_request request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo update_identity_request response',
  },

  'mongoInsertPidpTransaction': {
    SEND: 'publicIdp sent mongo insert_pidp_transaction request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo insert_pidp_transaction response',
  },

  'mongoUpdatePidpTransaction': {
    SEND: 'publicIdp sent mongo update_pidp_transaction request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo update_pidp_transaction response',
  },
  'mongoFindPidpTransaction': {
    SEND: 'publicIdp sent mongo find_pidp_transaction request',
    RECEIVED_SUCCESS: 'publicIdp recv mongo find_pidp_transaction response',
  },
});
