import axios from 'axios'

// Read base URL from Vite environment variable with a safe fallback to https://peoplepay360.onrender.com
// Note: Requests use the existing /api/v1 contract
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://peoplepay360.onrender.com').trim()
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const API_BASE_URL = normalizedBaseUrl.endsWith('/api/v1')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor to automatically attach Authorization: Bearer <token>
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('peoplepay_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 and 403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Clear auth/session and redirect to /login
        sessionStorage.removeItem('peoplepay_token')
        sessionStorage.removeItem('peoplepay_user')
        sessionStorage.removeItem('peoplepay_role')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API services
export const authApi = {
  login: async (credentials) => {
    // Request: { identifier, password }
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  getMe: async () => {
    // GET /api/v1/auth/me with Authorization header
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  requestPasswordReset: async (data) => {
    // POST /api/v1/auth/password-reset/request { identifier }
    const response = await apiClient.post('/auth/password-reset/request', data)
    return response.data
  },

  resetPassword: async (data) => {
    // POST /api/v1/auth/password-reset { token, new_password }
    const response = await apiClient.post('/auth/password-reset', data)
    return response.data
  },
}

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
