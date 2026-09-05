import { createContext, useContext, useState, useEffect } from 'react'

export const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin'
}

// Allowed route paths per role
export const ROLE_PERMISSIONS = {
  [ROLES.EMPLOYEE]: ['/employees', '/attendance', '/time-off', '/payroll'],
  [ROLES.HR_MANAGER]: ['/employees', '/contracts', '/schedules', '/attendance', '/time-off'],
  [ROLES.HR_PAYROLL_USER]: ['/payroll'],
  [ROLES.HR_PAYROLL_MANAGER]: ['/payroll'],
  [ROLES.ADMIN]: ['/users', '/employees', '/contracts', '/schedules', '/attendance', '/time-off', '/payroll']
}

// Default landing route after login / switch
export const ROLE_DEFAULT_ROUTES = {
  [ROLES.EMPLOYEE]: '/employees',
  [ROLES.HR_MANAGER]: '/employees',
  [ROLES.HR_PAYROLL_USER]: '/payroll',
  [ROLES.HR_PAYROLL_MANAGER]: '/payroll',
  [ROLES.ADMIN]: '/employees'
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    return sessionStorage.getItem('peoplepay_role') || ROLES.ADMIN
  })

  useEffect(() => {
    sessionStorage.setItem('peoplepay_role', role)
  }, [role])

  const canAccessRoute = (path) => {
    const allowed = ROLE_PERMISSIONS[role] || []
    return allowed.some(allowedPath => path === allowedPath || path.startsWith(`${allowedPath}/`))
  }

  const isRole = (...targetRoles) => {
    return targetRoles.includes(role)
  }

  return (
    <AuthContext.Provider value={{ role, setRole, canAccessRoute, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
