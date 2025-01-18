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

    static async getCarbonAndEnergyPending(req, res) {
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

    static async getEnergyAndCarbonRecycled(req, res) {
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

    static async filterByDcRecycled(req, res) {
        const company_id = parseInt(req.params.company_id);
        const data_center_id = parseInt(req.params.data_center_id);
        try {
            const data = await recyclables.filterByDcRecycled(company_id, data_center_id);
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

    static async filterBySerialNumber(req, res) {
        const { SN: serial_number } = req.query;
        try {
            await recyclables.preloadRecyclablesTable();
            const data = await recyclables.filterBySerialNumber(serial_number);
            if (!data) {
                return res.status(404).send('Energy and Carbon Data not found.');
            }
            console.log(data);
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
                userId,
                company_id,
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

    static async getAllPersonalDevices(req, res) {
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
    
}

module.exports = recycleController