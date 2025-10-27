import {
  ANALYTICS_DASHBOARD_URL,
  CLARITY_API_TOKEN,
  DOCUMENTATION_URL,
  SESSION_RECORDINGS_URL
} from "./constants.js";
import {
  type FiltersType,
  type SortOptionsType,
  SortOptionsEnum
} from "./types.js";
import { tryAsync } from "./utils.js";

export async function queryAnalyticsDashboardAsync(
  query: string,
  timezone: string,
): Promise<any> {
  return await tryAsync(ANALYTICS_DASHBOARD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(CLARITY_API_TOKEN ? { 'Authorization': `Bearer ${CLARITY_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      query: query,
      timezone: timezone,
    })
  });
}

export async function queryDocumentationAsync(query: string): Promise<any> {
  return await tryAsync(DOCUMENTATION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(CLARITY_API_TOKEN ? { 'Authorization': `Bearer ${CLARITY_API_TOKEN}` } : {})
    },
    body: JSON.stringify({
      query: query,
    })
  });
}

export async function listSessionRecordingsAsync(
  startDate: Date,
  endDate: Date,
  filters: FiltersType,
  sortBy: SortOptionsType,
  count: number
): Promise<any> {
  return await tryAsync(SESSION_RECORDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(CLARITY_API_TOKEN ? { 'Authorization': `Bearer ${CLARITY_API_TOKEN}` } : {})
    },
    body: JSON.stringify({
      sortBy: SortOptionsEnum[sortBy],
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      filters: filters,
      count: count
    })
  });
}
