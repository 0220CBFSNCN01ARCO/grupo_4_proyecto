const express = require('express');
const router = express.Router();

const infoController = require('../controllers/infoController');

router.get('/contact', infoController.getContact);
router.get('/nosotros', infoController.getNosotros);
router.get('/staff', infoController.getStaff);
router.get('/guest', infoController.getGuest);
router.get('/zonas', infoController.getZonas);
router.get('/prueba', infoController.prueba);

module.exports = router;