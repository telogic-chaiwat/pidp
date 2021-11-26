/* eslint-disable max-len */
const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
// const settings = JSON.parse(process.env.server);
const getToken = require('./authorization/simGetToken').getToken;
const refreshToken = require('./authorization/simRefreshToken').NAME;


router.post('/authorization/v1/getToken', getToken);
router.post('/authorization/v1/refreshToken', refreshToken);
router.post('/idp/response', (req, res, next)=>{
  res.status(202).send();
});

router.post('/idp/error_response', (req, res, next)=>{
  res.status(202).send();
});


router.post('/sign', (req, res, next)=>{
  res.status(200).send({
    signature: 'base64',
  });
});

router.get('/utility/nodes/:node_id', (req, res, next)=>{
  res.status(200).send({
    public_key: '1234',
    master_public_key: '12345',
    node_name: "{\"industry_code\":\"991\",\"company_code\":\"991\",\"marketing_name_th\":\"เอไอเอส\",\"marketing_name_en\":\"AIS SHOP \",\"proxy_or_subsidiary_name_th\":\"\",\"proxy_or_subsidiary_name_en\":\"\",\"role\":\"RP\",\"running\":\"1\"}",
    role: 'testing',
    node_id_whitelist_active: 'test',
    mp: {
      ip: '0.0.0.0',
      port: '1000',
    },
    active: true,
  });
});

router.post('/as/data/:request_id/:service_id', (req, res, next)=>{
  res.status(202).send({
    node_id: 'string',
    reference_id: 'string',
    callback_url: 'string',
    data: 'string',
  });
});

router.post('/as/error/:request_id/:service_id', (req, res, next)=>{
  res.status(202).send({
    node_id: 'string',
    reference_id: 'string',
    callback_url: 'string',
    data: 'string',
  });
});


router.post('/myIDS/v1/partner/check-dip-chip', (req, res, next)=>{
  res.status(200).send({
    'resultDesc': 'Success',
    'resultCode': '20000',
    'resultData': {
      'dip_chip_flag': 'Y',
      'create_time': '2021-03-12T14:00:00',
      'last_update_time': '2021-03-12T14:00:00',
      'msisdn': ['66800123444'],
    },

  });
});

router.post('/myIDS/v1/partner/sms', (req, res, next)=>{
  res.status(200).send({
    'resultDesc': 'Success',
    'resultCode': '20000',
  });
});

router.post('/myIDS/v1/partner/notifications/msisdn', (req, res, next)=>{
  res.status(200).send({
    'resultDesc': 'Success',
    'resultCode': '20000',
  });
});
module.exports = router;
