import axios from 'axios';

/**
 * Portfolio Service
 * Handle komunikasi dengan backend API untuk portfolio data
 */
export class PortfolioService {
  constructor(config = {}) {
    this.baseURL = config.backendURL || process.env.BACKEND_API_URL || 'http://localhost:3000/api';
    this.apiKey = config.apiKey || process.env.BACKEND_API_KEY;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      timeout: 10000,
    });
  }

  /**
   * Get user portfolio with all positions
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Portfolio data
   */
  async getPortfolio(userId) {
    try {
      const response = await this.client.get(`/portfolio/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error fetching portfolio:', error.message);
      throw new Error(`Failed to fetch portfolio: ${error.message}`);
    }
  }

  /**
   * Get specific portfolio by ID
   * @param {string} portfolioId - Portfolio identifier
   * @returns {Promise<Object>} Portfolio data with positions
   */
  async getPortfolioById(portfolioId) {
    try {
      const response = await this.client.get(`/portfolio/id/${portfolioId}`);
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error fetching portfolio by ID:', error.message);
      throw new Error(`Failed to fetch portfolio: ${error.message}`);
    }
  }

  /**
   * Get all positions for a portfolio
   * @param {string} portfolioId - Portfolio identifier
   * @returns {Promise<Array>} Array of positions
   */
  async getPositions(portfolioId) {
    try {
      const response = await this.client.get(`/portfolio/${portfolioId}/positions`);
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error fetching positions:', error.message);
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }
  }

  /**
   * Save rebalance suggestion to backend
   * @param {string} portfolioId - Portfolio identifier
   * @param {Object} suggestion - Rebalance suggestion data
   * @returns {Promise<Object>} Saved suggestion
   */
  async saveRebalanceSuggestion(portfolioId, suggestion) {
    try {
      const response = await this.client.post(`/portfolio/${portfolioId}/rebalance-suggestion`, {
        portfolioId,
        suggestion,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error saving rebalance suggestion:', error.message);
      throw new Error(`Failed to save suggestion: ${error.message}`);
    }
  }

  /**
   * Get rebalance history for a portfolio
   * @param {string} portfolioId - Portfolio identifier
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Array of rebalance history
   */
  async getRebalanceHistory(portfolioId, limit = 10) {
    try {
      const response = await this.client.get(`/portfolio/${portfolioId}/rebalance-history`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error fetching rebalance history:', error.message);
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  }

  /**
   * Update position data (after user executes rebalance)
   * @param {string} positionId - Position identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated position
   */
  async updatePosition(positionId, updates) {
    try {
      const response = await this.client.patch(`/position/${positionId}`, updates);
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error updating position:', error.message);
      throw new Error(`Failed to update position: ${error.message}`);
    }
  }

  /**
   * Create portfolio snapshot for historical tracking
   * @param {string} portfolioId - Portfolio identifier
   * @param {Object} snapshotData - Snapshot data
   * @returns {Promise<Object>} Created snapshot
   */
  async createSnapshot(portfolioId, snapshotData) {
    try {
      const response = await this.client.post(`/portfolio/${portfolioId}/snapshot`, {
        portfolioId,
        ...snapshotData,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('[PortfolioService] Error creating snapshot:', error.message);
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
  }
}
