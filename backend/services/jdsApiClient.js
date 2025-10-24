import axios from 'axios';

class JDSApiClient {
  constructor() {
    this.baseURL = process.env.JDS_API_BASE_URL || 'https://api.jdsapp.com';
  }

  /**
   * Get product details by SKUs using user's API token
   * @param {string[]} skus - Array of SKU codes
   * @param {string} userToken - User's JDS API token
   * @returns {Promise<Object[]>} Array of product objects
   */
  async getProductDetailsBySkus(skus, userToken) {
    if (!userToken) {
      throw new Error('JDS API token not provided');
    }

    if (!skus || skus.length === 0) {
      throw new Error('At least one SKU is required');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/get-product-details-by-skus`,
        { skus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          params: {
            token: userToken
          }
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('JDS API Error:', error.response.status, error.response.data);
        throw new Error(`JDS API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('JDS API No Response:', error.request);
        throw new Error('No response from JDS API');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('JDS API Request Error:', error.message);
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Parse SKU string input (handles comma-separated, space-separated, or newline-separated SKUs)
   * @param {string} input - SKU input string
   * @returns {string[]} Array of cleaned SKU codes (converted to uppercase)
   */
  parseSkuInput(input) {
    if (!input || typeof input !== 'string') {
      return [];
    }

    // Split by comma, newline, or whitespace and filter out empty strings
    // Convert to uppercase for case-insensitive matching
    const skus = input
      .split(/[,\n\s]+/)
      .map(sku => sku.trim().toUpperCase())
      .filter(sku => sku.length > 0);

    return skus;
  }
}

export default new JDSApiClient();
