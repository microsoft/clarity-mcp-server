import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { 
  ClarityApiError, 
  ClarityApiResponse,
  ClarityDimension, 
  ClarityExportApiParams,
  ClarityMetricData
} from './types.js';

/**
 * Service class for handling Microsoft Clarity Data Export API requests
 */
export class ClarityService {
  private apiToken: string;
  private baseUrl: string;
  private dailyRequestCount: Map<string, number>;
  private lastRequestTime: Date | null;
  private static DAILY_REQUEST_LIMIT = 10;
  private static REQUEST_INTERVAL_MS = 1000; // 1 second between requests

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.baseUrl = 'https://www.clarity.ms/export-data/api/v1';
    this.dailyRequestCount = new Map<string, number>();
    this.lastRequestTime = null;
    
    // Reset the counter at midnight
    this.setupDailyCounterReset();
  }

  /**
   * Sets up a timer to reset the daily request counter at midnight
   */
  private setupDailyCounterReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyRequestCount.clear();
      // Set up the next day's reset
      this.setupDailyCounterReset();
    }, timeUntilMidnight);
  }

  /**
   * Retrieves the current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Tracks API requests to prevent exceeding daily limits
   * @returns true if the request can be made, false if limit exceeded
   */
  private trackRequest(): boolean {
    const today = this.getCurrentDate();
    const currentCount = this.dailyRequestCount.get(today) || 0;
    
    if (currentCount >= ClarityService.DAILY_REQUEST_LIMIT) {
      return false;
    }
    
    this.dailyRequestCount.set(today, currentCount + 1);
    return true;
  }

  /**
   * Enforces a minimum time between API requests
   */
  private async enforceRequestInterval(): Promise<void> {
    if (!this.lastRequestTime) {
      this.lastRequestTime = new Date();
      return;
    }
    
    const now = new Date();
    const timeSinceLastRequest = now.getTime() - this.lastRequestTime.getTime();
    
    if (timeSinceLastRequest < ClarityService.REQUEST_INTERVAL_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, ClarityService.REQUEST_INTERVAL_MS - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = new Date();
  }

  /**
   * Formats the API error response
   */
  private formatError(error: AxiosError): ClarityApiError {
    if (error.response) {
      const status = error.response.status;
      let message = '';
      let reason = '';
      
      switch (status) {
        case 401:
          message = 'Unauthorized';
          reason = 'Missing, invalid, or expired token';
          break;
        case 403:
          message = 'Forbidden';
          reason = 'Token not authorized for operation';
          break;
        case 400:
          message = 'Bad Request';
          reason = 'Invalid request parameters';
          break;
        case 429:
          message = 'Too Many Requests';
          reason = 'Exceeded daily limit';
          break;
        default:
          message = 'Unknown Error';
          reason = 'An unexpected error occurred';
      }
      
      return {
        code: status,
        message,
        reason
      };
    }
    
    return {
      code: 500,
      message: 'Internal Error',
      reason: error.message
    };
  }

  /**
   * Fetches data from Microsoft Clarity Data Export API
   * @param params Request parameters
   * @returns The API response data
   * @throws Error if the API request fails
   */
  public async fetchData(params: ClarityExportApiParams): Promise<ClarityApiResponse> {
    // Check if we've hit the daily limit
    if (!this.trackRequest()) {
      throw new Error('Daily API request limit exceeded (10 requests per day)');
    }
    
    // Enforce minimum time between requests
    await this.enforceRequestInterval();
    
    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        params
      };
      
      const response = await axios.get(
        `${this.baseUrl}/project-live-insights`,
        config
      );
      
      return response.data as ClarityApiResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const clarityError = this.formatError(error);
        throw new Error(`Clarity API Error: ${clarityError.message} - ${clarityError.reason}`);
      }
      throw new Error(`Unexpected error: ${(error as Error).message}`);
    }
  }

  /**
   * Validates dimension count doesn't exceed 3
   * @param dimensions Array of dimensions to validate
   * @throws Error if more than 3 dimensions are provided
   */
  public validateDimensions(...dimensions: (ClarityDimension | undefined)[]): void {
    const validDimensions = dimensions.filter(d => d !== undefined);
    if (validDimensions.length > 3) {
      throw new Error('Maximum of 3 dimensions can be passed in a single request');
    }
  }

  /**
   * Gets the remaining request count for today
   */
  public getRemainingRequests(): number {
    const today = this.getCurrentDate();
    const currentCount = this.dailyRequestCount.get(today) || 0;
    return Math.max(0, ClarityService.DAILY_REQUEST_LIMIT - currentCount);
  }

  /**
   * Formats the response data into a more readable format
   */
  public formatResponseData(data: ClarityApiResponse): string {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    let result = '';

    for (const metric of data) {
      result += `## ${metric.metricName}\n\n`;
      
      if (!metric.information || metric.information.length === 0) {
        result += 'No information available\n\n';
        continue;
      }

      // Create a table for the data
      const keys = Object.keys(metric.information[0]);
      
      // Create header row
      result += '| ' + keys.join(' | ') + ' |\n';
      result += '| ' + keys.map(() => '---').join(' | ') + ' |\n';
      
      // Add data rows
      for (const item of metric.information) {
        result += '| ' + keys.map(key => item[key] !== undefined ? item[key] : 'N/A').join(' | ') + ' |\n';
      }
      
      result += '\n';
    }

    return result;
  }
}