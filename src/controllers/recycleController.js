const recyclables = require("../models/recyle")
const fs = require('fs');
const path = require("path")

class recycleController {

    static async getEnergyAndCarbonNotRecycled(req, res) {
        const company_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getCarbonAndEnergyNotRecycled(company_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }


    static async getCompanyRecycled(req, res) {
        const company_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getCarbonAndEnergyRecycled(company_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async searchEquipment(req, res) {
        const company_id = parseInt(req.params.company_id);
        const { search_term } = req.body;
        try {
            const data = await recyclables.searchEquipment(company_id, search_term);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByDc(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.filterByDc(company_id, data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByDcPending(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.filterByDCPending(company_id, data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getCompanyRecycledByDc(req, res) {
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.filterByDcRecycled(data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByDcAndSearchTerm(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        const { search_term } = req.body;
        try {
            const data = await recyclables.filterByDcAndSearchTerm(company_id, data_center_id, search_term);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByDcAndSearchTermPending(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        const { search_term } = req.body;
        try {
            const data = await recyclables.filterByDcAndSearchTermPending(company_id, data_center_id, search_term);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByDcAndSearchTermRecycled(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        const { search_term } = req.body;
        try {
            const data = await recyclables.filterByDcAndSearchTermRecycled(company_id, data_center_id, search_term);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterByCompanySerialNumber(req, res) {
        const { SN: serial_number } = req.query;
        try {
            const data = await recyclables.filterByCompanySerialNumber(serial_number);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async filterBySerialNumber(req, res) {
        const { SN: serial_number } = req.query;
        try {
            await recyclables.preloadRecyclablesTable();
            const data = await recyclables.filterBySerialNumber(serial_number);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }
    

    static async addPersonalDevice(req, res) {
        const userId = req.user.userId;
        const { device_type, brand, model, serial_number, image } = req.body;   
        const company_id = parseInt(req.params.company_id);
        // Validate required fields
        if (!device_type || !brand || !model || !serial_number || !image) {
            return res.status(400).json({ message: "All fields are required, including an image." });
        }
        try {
            // Decode Base64 image and save it
            const base64Data = image.replace(/^data:image\/png;base64,/, ""); // Remove Base64 prefix
            const uniqueFileName = `${userId}_${Date.now()}.png`;
            const targetPath = path.join(__dirname, `../uploads/device-pictures/${uniqueFileName}`);
            await fs.promises.writeFile(targetPath, base64Data, 'base64');
            // Save device details in the database
            const data = await recyclables.addPersonalDevice(
                brand,
                model,
                serial_number,
                "Awaiting Approval",
                "Personal",
                device_type,
                userId,
                company_id,
                null,
                uniqueFileName
            );
    
            if (!data) {
                return res.status(404).json({ message: "Failed to submit application." });
            }
            res.status(200).json({ message: "Device submitted successfully!", data });
        } catch (error) {
            console.error("Error in addPersonalDevice:", error);
            res.status(500).send("Failed to submit application: Internal Server Error.");
        }
    }

    static async getPersonalDevicesAwaitingApproval(req, res) {
        const comppany_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getPersonalDevicesAwaitingApproval(comppany_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getPersonalDevicesRejected(req, res) {
        const comppany_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getPersonalDevicesRejected(comppany_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }
    
    // static async getPersonalDevicesAwaitingApprovalByDc(req, res) {
    //     const data_center_id = parseInt(req.params.data_center_id);
    //     try {
    //         const data = await recyclables.getPersonalDevicesAwaitingApprovalByDc(data_center_id);
    //         if (!data) {
    //             return res.status(404).send('Energy and Carbon Data not found.');
    //         }
    //         return res.status(200).json(data);
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
    //     }
    // }

    static async getPersonalDevicesPendingPickUp(req, res) {
        const company_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getPersonalDevicesPendingPickUp(company_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getPersonalDevicesPendingPickUpByDc(req, res) {
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.getPersonalDevicesPendingPickUpByDc(data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getCompanyPendingPickUp(req, res) {
        const company_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getCarbonAndEnergyPending(company_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }
    static async getCompanyPendingPickUpByDc(req, res) {
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.getCompanyPendingPickUpByDc(data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getPersonalDevicesRecycled(req, res) {
        const company_id = parseInt(req.params.company_id);
        try {
            const data = await recyclables.getPersonalDevicesRecycled(company_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getPersonalDevicesRecycledByDc(req, res) {
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.getPersonalDevicesRecycledByDc(data_center_id);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }

    static async getDeviceBySN(req, res) {
        const { SN: serial_number } = req.query;
        if (!serial_number) {
            return res.status(400).send('Serial number is required.');
        }
        try {
            const data = await recyclables.getDeviceBySerialNumber(serial_number);
            if (!data) {
                return res.status(404).send('Device not found or status unchanged.');
            }
            const dataCenterId = data[0]?.data_center_id;
            return res.status(200).json({ dataCenterId });
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve Energy and Carbon Data: Internal Server Error.');
        }
    }


    static async updateCompanyDeviceStatus(req, res) {
        const { SN: serial_number } = req.query;
        const { status, company_id } = req.body; // Assuming the new status is sent in the request body
    
        if (!serial_number || !status) {
            return res.status(400).send('Serial number and status are required.');
        }
    
        try {
            // Update the device status in the devices table
            const success = await recyclables.updateCompanyDeviceStatus(serial_number, status);
    
            if (!success) {
                return res.status(404).send('Device not found or status unchanged.');
            }
    
            // If the status is "Pending Pick Up", insert the device into the recyclables table
            if (status === 'Pending Pick Up') {
                // Retrieve the device details to insert into the recyclables table
                const deviceData = await recyclables.filterByCompanySerialNumber(serial_number);
                if (!deviceData || deviceData.length === 0) {
                    return res.status(404).send('Device details not found for insertion into recyclables.');
                }
    
                const device = deviceData[0];
                const dcId = await recyclables.getDeviceBySerialNumber(device.serial_number);
                const dataCenterId = dcId[0]?.data_center_id;
                const details = {
                    brand: device.brand,
                    model: device.model,
                    serial_number: device.serial_number,
                    status: 'Pending Pick Up',
                    type: 'Company', 
                    device_type: device.device_type,
                    user_id: null, // it's not a personal device
                    company_id: company_id,
                    data_center_id: dataCenterId,
                    image_path: '34567890-.png',
                };
    
                // Insert the device into the recyclables table
                const insertSuccess = await recyclables.insertIntoRecyclables(details);
                if (!insertSuccess) {
                    console.error('Failed to insert into recyclables table.');
                    return res.status(500).send('Failed to add device to recyclables.');
                }
            }
    
            return res.status(200).send('Device status updated successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to update device status: Internal Server Error.');
        }
    }
    
    static async updatePersonalDeviceStatus(req, res) {
        const { SN: serial_number } = req.query;
        const { status } = req.body;
        try {
            const data = await recyclables.updateToRecyclables(serial_number, status);
            if (!data) {
                return res.status(404).send('Device not found or status unchanged.');
            }
            return res.status(200).send('Device status updated successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to update device status: Internal Server Error.');
        }
    }























    static async addActivityLogAndPoints(req, res) {
        const { user_id } = req.body;
        const points = 1000;
        const activity_type = "Recycled E-Waste";
        const post_id = null; // Assuming no post is involved in this activity
        const date = new Date();

        try {
            // Validate user_id
            if (!user_id) {
                return res.status(404).send({ error: "User ID not found" });
            }
            await recyclables.addActivityLogAndPoints(user_id, post_id, activity_type, points, date);
            const checkUser = await recyclables.checkUserById(user_id);
            if (!checkUser) {
                await recyclables.insertToUserRewards(user_id, points);
            } else {
                await recyclables.updateToUserRewards(user_id, points);
            }
            return res.status(200).send({ message: "Activity log and points added successfully." });
        } catch (error) {
            console.error("Error in addActivityLogAndPoints:", error);
            return res.status(500).send({ error: "An error occurred while adding activity log and points." });
        }
    }


}

module.exports = recycleController