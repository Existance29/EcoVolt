const recycleController = require('../controllers/recycleController');
const authenticateToken = require("../middlewares/authenticateToken")
const multer = require("multer");
const path = require("path");

const upload = multer({
    dest: path.join(__dirname, "../uploads/device-pictures")
});

const recycleRoute = (app) => {
    app.get('/recycle/getDcId', recycleController.getDeviceBySN);


    app.get('/recycle/:company_id', recycleController.getEnergyAndCarbonNotRecycled);
    app.post('/recycle/:company_id/search/filter/:data_center_id', recycleController.filterByDcAndSearchTerm);
    app.get('/recycle/:company_id/filter/:data_center_id', recycleController.filterByDc);

    app.get('/device/personal/details', recycleController.filterBySerialNumber);
    app.get('/device/company/details', recycleController.filterByCompanySerialNumber);
    app.post('/recycle/personal-device/:company_id', authenticateToken, upload.single('image'), recycleController.addPersonalDevice);

    app.get('/recycle/employee-application/:company_id', recycleController.getPersonalDevicesAwaitingApproval);
    app.get('/recycle/employee-application-Rejected/:company_id', recycleController.getPersonalDevicesRejected);
    // app.get('/recycle/employee-application-DC/:data_center_id', recycleController.getPersonalDevicesAwaitingApprovalByDc);

    app.get('/recycle/personal/pending-pickup/:company_id', recycleController.getPersonalDevicesPendingPickUp);
    app.get('/recycle/personal-DC/pending-pickup/:data_center_id', recycleController.getPersonalDevicesPendingPickUpByDc);
    app.get('/recycle/company/pending-pickup/:company_id', recycleController.getCompanyPendingPickUp);
    app.get('/recycle/company-DC/pending-pickup/:data_center_id', recycleController.getCompanyPendingPickUpByDc);

    app.get('/recycle/company/recycled/:company_id', recycleController.getCompanyRecycled);
    app.get('/recycle/company/recycled-DC/:data_center_id', recycleController.getCompanyRecycledByDc);    
    app.get('/recycle/personal/recycled/:company_id', recycleController.getPersonalDevicesRecycled);
    app.get('/recycle/personal/recycled-DC/:data_center_id', recycleController.getPersonalDevicesRecycledByDc);

    app.put('/recycle/personal/status', recycleController.updatePersonalDeviceStatus); // to update personal device status
    app.put('/recycle/:data_center_id/status', recycleController.updateCompanyDeviceStatus); // to move to recylables table


    // --------------------------------------- Points -----------------------------------
    
    app.post('/recycle/award-points', recycleController.addActivityLogAndPoints);


};

module.exports = recycleRoute;
