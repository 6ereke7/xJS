export class HttpClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = this.baseURL + endpoint;
    
    // Merge default headers with any custom request headers
    const headers = {
      ...this.defaultHeaders,
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    // If a body is passed and it's an object, automatically stringify it
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Parse JSON response if available
      const data = response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : await response.text();

      if (!response.ok) {
        throw { status: response.status, data };
      }

      return data;
    } catch (error) {
      console.error(`HTTP Error [${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}
