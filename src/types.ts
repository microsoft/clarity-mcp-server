/**
 * Types for Microsoft Clarity Data Export API
 * Based on: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
 */

// Possible dimensions from the API documentation
export enum ClarityDimension {
  Browser = 'Browser',
  Device = 'Device',
  CountryRegion = 'Country/Region',
  OS = 'OS',
  Source = 'Source',
  Medium = 'Medium',
  Campaign = 'Campaign',
  Channel = 'Channel',
  URL = 'URL',
  PageTitle = 'Page Title',
  ReferrerURL = 'Referrer URL',
}

// Interface for API request parameters
export interface ClarityExportApiParams {
  numOfDays: 1 | 2 | 3; // Limited to 1, 2, or 3 days
  dimension1?: ClarityDimension;
  dimension2?: ClarityDimension;
  dimension3?: ClarityDimension;
  projectId?: string; // Added projectId as optional parameter
}

// Interfaces for API response structure
export type MetricName = 
  | 'Traffic' 
  | 'Popular Pages' 
  | 'Browser' 
  | 'Device' 
  | 'OS' 
  | 'Country/Region' 
  | 'Scroll Depth' 
  | 'Engagement Time';

export interface ClarityMetricData {
  totalSessionCount?: string;
  totalBotSessionCount?: string;
  distantUserCount?: string;
  PagesPerSessionPercentage?: number;
  OS?: string;
  Browser?: string;
  Device?: string;
  Country?: string;
  URL?: string;
  PageTitle?: string;
  ReferrerURL?: string;
  DeadClickCount?: string;
  ExcessiveScroll?: string;
  RageClickCount?: string;
  QuickbackClick?: string;
  ScriptErrorCount?: string;
  ErrorClickCount?: string;
  [key: string]: any; // For other potential fields
}

export interface ClarityMetric {
  metricName: MetricName;
  information: ClarityMetricData[];
}

export type ClarityApiResponse = ClarityMetric[];

// Error response type
export interface ClarityApiError {
  code: number;
  message: string;
  reason: string;
}