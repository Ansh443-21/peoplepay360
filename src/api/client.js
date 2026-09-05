import axios from 'axios'

// Read base URL from Vite environment variable with a safe fallback
// Note: Requests use the existing /api/v1 contract
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const API_BASE_URL = normalizedBaseUrl ? `${normalizedBaseUrl}/api/v1` : '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Employees API services
export const employeesApi = {
  getAll: async () => {
    const response = await apiClient.get('/employees/')
    return response.data
  },

  getById: async (employeeId) => {
    const response = await apiClient.get(`/employees/${employeeId}`)
    return response.data
  },

  create: async (employeeData) => {
    const response = await apiClient.post('/employees/', employeeData)
    return response.data
  },

  update: async (employeeId, employeeData) => {
    const response = await apiClient.patch(`/employees/${employeeId}`, employeeData)
    return response.data
  },
}

// Schedules API services
export const schedulesApi = {
  getAll: async (params) => {
    const response = await apiClient.get('/schedules/', { params })
    return response.data
  },

  getById: async (scheduleId) => {
    const response = await apiClient.get(`/schedules/${scheduleId}`)
    return response.data
  },

  create: async (scheduleData) => {
    const response = await apiClient.post('/schedules/', scheduleData)
    return response.data
  },

  update: async (scheduleId, scheduleData) => {
    const response = await apiClient.patch(`/schedules/${scheduleId}`, scheduleData)
    return response.data
  },
}

// Contracts API services
export const contractsApi = {
  getAll: async (params) => {
    const response = await apiClient.get('/contracts/', { params })
    return response.data
  },

  getById: async (contractId) => {
    const response = await apiClient.get(`/contracts/${contractId}`)
    return response.data
  },

  create: async (contractData) => {
    const response = await apiClient.post('/contracts/', contractData)
    return response.data
  },

  update: async (contractId, contractData) => {
    const response = await apiClient.patch(`/contracts/${contractId}`, contractData)
    return response.data
  },

  getActiveForEmployee: async (employeeId) => {
    const response = await apiClient.get(`/employees/${employeeId}/active-contract`)
    return response.data
  },
}

export default apiClient
