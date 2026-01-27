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

  // API endpoint to get award types list  
  async getAwardTypesList(req, res) {
    try {
      const awardTypes = this.adminService.getAwardTypesList();
      res.json({ success: true, data: awardTypes });
    } catch (error) {
      console.error('Error getting award types list:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load award types list' 
      });
    }
  }
  
  // Combined API endpoint using existing methods with Promise.all
  async getPrepareSubmitData(req, res) {
    try {
      // Use Promise.all to fetch both data sources simultaneously
      const [exhibitorsResult, awardTypesResult] = await Promise.all([
        // Wrap sync calls in Promise.resolve for consistency
        Promise.resolve(this.adminService.getExhibitorsList()),
        Promise.resolve(this.adminService.getAwardTypesList())
      ]);

      // Return combined data structure
      res.json({ 
        success: true, 
        data: {
          exhibitors: exhibitorsResult,
          awardTypes: awardTypesResult,
          loadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting combined submit data:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load submit form data' 
      });
    }
  }
}

module.exports = AdminController;   