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

  // API endpoint to get all the previous event names
  async getEventNamesList(req, res) {
    try {
      const eventNames = this.adminService.getEventNamesList();
      res.json({ success: true, data: eventNames });
    } catch (error) {
      console.error('Error getting event names list:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load event names list' 
      });
    }
  }

  // API endpoint to get all previous photographers
  async getPhotographersList(req, res) {
    try {
      const photographers = this.adminService.getPhotographersList();
      res.json({ success: true, data: photographers });
    } catch (error) {
      console.error('Error getting photographers list:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load photographers list' 
      });
    }
  }

  // Api endpoint to get all previous award numbers
  async getAwardNumbersList(req, res) {
    try {
      const awardNumbers = this.adminService.getAwardNumbersList();
      // Sort award numbers into categories by their first 4 digits, then move them into an object with that key
      const categorizedAwardNumbers = awardNumbers.reduce((acc, awardNum) => {
        const key = awardNum.substring(0, 4);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(awardNum);
        return acc;
      }, {});

      res.json({ success: true, data: categorizedAwardNumbers });
    } catch (error) {
      console.error('Error getting award numbers list:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load award numbers list' 
      });
    }
  }

  // API endpoint to get all awards missing an image
  async getAwardsMissingImage(req, res) {
    try {
      const awardsMissingImage = this.adminService.getAwardsMissingImage();
      res.json({ success: true, data: awardsMissingImage });
    } catch (error) {
      console.error('Error getting awards missing image:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards missing image' 
      });
    }
  }

  // API endpoint to get all awards with a null value in a field
  async getAwardsWithNullValues(req, res) {
    const category = req.params.category;
    if (!category) {
      return res.status(400).json({ 
        success: false,
        error: 'Category parameter required' 
      });
    }

    try {
      const nullAwards = this.adminService.getAwardsWithNullValues(category);

      // Don't return awards with exhibtior value of "Test Name" since those are just test entries we added to find null values
      const filteredNullAwards = nullAwards.filter(award => award.exhibitor !== 'Test Name');

      // Trim nullAwards to only include the id and awardNum for easier display
      const trimmedNullAwards = filteredNullAwards.map(award => ({
        awardNum: award.awardNum,
        exhibitor: award.exhibitor
      }));

      res.json({ success: true, category: category, data: trimmedNullAwards });
    } catch (error) {
      console.error(`Error getting awards with null values for category ${category}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards with null values for the specified category' 
      });
    }
  }

  // API endpoint to get all awards that reference another award in the description field, check it is displaying properly in the admin panel
  async getAwardsReferencingAwards(req, res) {
    console.log('DEBUG - Getting awards referencing awards');
    try {
      const referencingAwards = this.adminService.getAwardsReferencingAwards();

      // Look up descriptions of referenced awards and add them to the results
      for (const award of referencingAwards) {
        const referencedAwardNums = [];

        // Use regex to find all occurrences of award numbers in the description, looking for patterns like "1234", "#1234", "award 1234", etc.
        const regex = /(?:#?)(\d{8,})/g;
        let match;
        while ((match = regex.exec(award.description)) !== null) {
          // Determine year of the referenced award based on the first 4 digits of the award number
          let referencedYear = String(match[1]).substring(0, 4);
          if (referencedYear.length === 4 && !isNaN(referencedYear)) {
            // check if found year is not already within the reference year list
            if (award.referencedYears && award.referencedYears.includes(referencedYear)) {
              continue;
            }

            referencedYear = parseInt(referencedYear);
          } else {
            referencedYear = 'Unknown Year';
          }

          referencedAwardNums.push([match[1], referencedYear]);
        }
        award.referencedAwards = referencedAwardNums.map(item => item[0]);
        award.referencedYears = referencedAwardNums.map(item => item[1]);

      }

      // Trim results to only include awardNum, exhibitor, description, and referencedAwards for easier display
      const trimmedReferencingAwards = referencingAwards.map(award => ({
        awardNum: award.awardNum,
        date: award.date,
        exhibitor: award.exhibitor,
        description: award.description,
        referencedAwards: award.referencedAwards,
        referencedYears: award.referencedYears
      }));


      res.json({ success: true, data: trimmedReferencingAwards });
    } catch (error) {
      console.error('Error getting awards referencing awards:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards referencing awards' 
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