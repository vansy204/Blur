import { API_BASE, PROFILE_API } from '../utils/constants';
import { getToken } from '../utils/auth';

export const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

export const profileApiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${PROFILE_API}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

