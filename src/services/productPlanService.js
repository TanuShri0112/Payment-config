// API service for Product Plans
const API_BASE_URL = 'https://payment-backend-kadg.onrender.com/api';

const productPlanService = {
  // Create a new plan
  async createPlan(planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/product-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  // Get all plans (optional productName filter)
  async getAllPlans(productName = '') {
    try {
      const url = productName 
        ? `${API_BASE_URL}/product-plan?productName=${encodeURIComponent(productName)}`
        : `${API_BASE_URL}/product-plan`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch plans');
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Get plan by ID
  async getPlanById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/product-plan/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  },

  // Update plan
  async updatePlan(id, planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/product-plan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  // Delete plan
  async deletePlan(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/product-plan/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete plan');
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },
};

export default productPlanService;
