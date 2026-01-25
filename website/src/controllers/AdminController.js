/* Future Location for admin controller, able to add-delete-update awards from the database*/

const AdminServices = require('../services/AdminServices');

class AdminController {
  constructor() {
    this.adminService = new AdminServices();
  }

  // API endpoint to get all exhibitors
  async getExhibitorsList(req, res) {
    try {
      const exhibitors = this.adminService.getExhibitorsList();
      res.json({ success: true, data: exhibitors });
    } catch (error) {
      console.error('Error getting exhibitors:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load exhibitors' 
      });
    }
  }

  // API endpoint to get awards for a specific exhibitor
  async getAwardsByExhibitor(req, res) {
    const exhibitor = req.params.exhibitor;
    if (!exhibitor) {
      return res.status(400).json({ 
        success: false,
        error: 'Exhibitor parameter required' 
      });
    }

    try {
      const awards = this.adminService.getAwardsByExhibitor(exhibitor);
      res.json({ success: true, data: awards });
    } catch (error) {
      console.error(`Error getting awards for exhibitor ${exhibitor}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified exhibitor' 
      });
    }
  }

  // API endpoint to get award counts by exhibitor  
  async getAwardCountsByExhibitor(req, res) {
    try {
      const counts = this.adminService.getAwardCountsByExhibitor();
      res.json({ success: true, data: counts });
    } catch (error) {
      console.error('Error getting award counts by exhibitor:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load award counts by exhibitor' 
      });
    }
  }
}

module.exports = AdminController;   