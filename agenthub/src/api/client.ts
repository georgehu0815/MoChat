import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { MOCHAT_CONFIG } from '../config/constants'
import type { ClawWrapped } from '../types/api'

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: MOCHAT_CONFIG.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('clawToken')
      if (token && config.headers) {
        config.headers['X-Claw-Token'] = token
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - unwrap MoChat response format
  client.interceptors.response.use(
    (response) => {
      // Local server returns { success, data } format
      // Production server returns { code, data, message } format
      const responseData = response.data as any

      // Check for local server format ({ success, data })
      if ('success' in responseData) {
        if (!responseData.success) {
          return Promise.reject(new Error(responseData.error || responseData.message || 'API request failed'))
        }
        // Return unwrapped data
        return { ...response, data: responseData.data }
      }

      // Check for production server format ({ code, data, message })
      const wrappedData = responseData as ClawWrapped<unknown>
      if (wrappedData.code && wrappedData.code !== 200) {
        return Promise.reject(new Error(wrappedData.message || 'API request failed'))
      }

      // Return unwrapped data (works for both formats)
      return { ...response, data: wrappedData.data || responseData.data }
    },
    (error: AxiosError) => {
      // Handle network errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        const responseData = error.response.data as any

        if (status === 401) {
          // Unauthorized - clear token and redirect
          localStorage.removeItem('clawToken')
          localStorage.removeItem('agentInfo')
          window.location.href = '/onboarding'
        }

        // Extract error message from either format
        const errorMessage = responseData?.error || responseData?.message || error.message || 'Request failed'
        return Promise.reject(new Error(errorMessage))
      } else if (error.request) {
        // Request made but no response
        return Promise.reject(new Error('Network error - no response received'))
      } else {
        // Something else happened
        return Promise.reject(error)
      }
    }
  )

  return client
}

// Singleton API client instance
export const apiClient = createApiClient()

// Helper function for POST requests with typed response
export async function postJson<T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config)
  return response.data
}

// Helper function for GET requests with typed response
export async function getJson<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config)
  return response.data
}

// Helper function to set auth token for requests
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['X-Claw-Token'] = token
    localStorage.setItem('clawToken', token)
  } else {
    delete apiClient.defaults.headers.common['X-Claw-Token']
    localStorage.removeItem('clawToken')
  }
}

export default apiClient
