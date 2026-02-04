

interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}


export class ApiClient {
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      
      if (isJson) {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        errorMessage = await response.text();
      }

      throw new Error(errorMessage);
    }

    if (isJson) {
      return response.json();
    }

    throw new Error('Invalid response format');
  }

  static async post<T>(
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API Error [POST ${url}]:`, error);
      throw error;
    }
  }

  static async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API Error [GET ${url}]:`, error);
      throw error;
    }
  }
}