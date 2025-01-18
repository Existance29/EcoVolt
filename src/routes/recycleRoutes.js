const recycleController = require('../controllers/recycleController');
const authenticateToken = require("../middlewares/authenticateToken")
const multer = require("multer");
const path = require("path");

const upload = multer({
    dest: path.join(__dirname, "../uploads/device-pictures")
});

const recycleRoute = (app) => {
    app.get('/recycle/:company_id', recycleController.getEnergyAndCarbonNotRecycled);
    app.get('/recycle/recycled/:company_id', recycleController.getEnergyAndCarbonRecycled);
    app.post('/recycle/:company_id/search', recycleController.searchEquipment);
    app.post('/recycle/:company_id/search/filter/:data_center_id', recycleController.filterByDcAndSearchTerm);
    app.post('/recycle/:company_id/search/filter-pending/:data_center_id', recycleController.filterByDcAndSearchTermPending);
    app.post('/recycle/:company_id/search/filter-recycled/:data_center_id', recycleController.filterByDcAndSearchTermRecycled);
    app.get('/recycle/:company_id/filter/:data_center_id', recycleController.filterByDc);
    app.get('/recycle/:company_id/filter-pending/:data_center_id', recycleController.filterByDcPending);
    app.get('/recycle/:company_id/filter-recycled/:data_center_id', recycleController.filterByDcRecycled);
    app.get('/device/details', recycleController.filterBySerialNumber);
    app.post('/recycle/personal-device/:company_id', authenticateToken, upload.single('image'), recycleController.addPersonalDevice);
};

module.exports = recycleRoute;
