import { createContext, useContext, useState } from 'react'

export const ROLES = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  PAYROLL: 'PAYROLL',
  EMPLOYEE: 'EMPLOYEE'
}

// Map any incoming role string to our standard roles
export const mapToStandardRole = (rawRole) => {
  if (!rawRole) return ROLES.EMPLOYEE
  const upper = String(rawRole).trim().toUpperCase()
  if (upper.includes('ADMIN')) return ROLES.ADMIN
  if (upper.includes('PAYROLL')) return ROLES.PAYROLL
  if (upper.includes('HR')) return ROLES.HR
  return ROLES.EMPLOYEE
}

// Module IDs available in the application
export const MODULES = {
  EMPLOYEES: 'employees',
  CONTRACTS: 'contracts',
  SCHEDULES: 'schedules',
  ATTENDANCE: 'attendance',
  TIMEOFF: 'time-off',
  PAYROLL: 'payroll',
  USERS: 'users',
}

// Permissions per role:
// ADMIN → everything
// HR → Employees, Contracts, Schedules, Attendance, Time Off
// PAYROLL → Payroll/Payruns/Payslips + relevant read-only employee/contract data
// EMPLOYEE → own Profile, Attendance, Time Off, Payslips
export const ROLE_ALLOWED_MODULES = {
  [ROLES.ADMIN]: [
    MODULES.EMPLOYEES,
    MODULES.CONTRACTS,
    MODULES.SCHEDULES,
    MODULES.ATTENDANCE,
    MODULES.TIMEOFF,
    MODULES.PAYROLL,
    MODULES.USERS,
  ],
  [ROLES.HR]: [
    MODULES.EMPLOYEES,
    MODULES.CONTRACTS,
    MODULES.SCHEDULES,
    MODULES.ATTENDANCE,
    MODULES.TIMEOFF,
  ],
  [ROLES.PAYROLL]: [
    MODULES.PAYROLL,
    MODULES.EMPLOYEES,
    MODULES.CONTRACTS,
  ],
  [ROLES.EMPLOYEE]: [
    MODULES.EMPLOYEES,
    MODULES.ATTENDANCE,
    MODULES.TIMEOFF,
    MODULES.PAYROLL,
  ]
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('peoplepay_token') || null)
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('peoplepay_user')
    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })

  const [role, setRoleState] = useState(() => {
    return sessionStorage.getItem('peoplepay_role') || ROLES.ADMIN
  })

  // Single SPA view state — stays at /employees
  const [activeModule, setActiveModule] = useState(MODULES.EMPLOYEES)

  const employeeId = user?.employee_id || user?.id || null

  const setAuth = ({ token: newToken, user: newUser, role: newRole }) => {
    const standardRole = mapToStandardRole(newRole || newUser?.role)
    if (newToken) {
      sessionStorage.setItem('peoplepay_token', newToken)
      setToken(newToken)
    }
    if (newUser) {
      sessionStorage.setItem('peoplepay_user', JSON.stringify(newUser))
      setUser(newUser)
    }
    if (standardRole) {
      sessionStorage.setItem('peoplepay_role', standardRole)
      setRoleState(standardRole)
    }
  }

  const logout = () => {
    sessionStorage.removeItem('peoplepay_token')
    sessionStorage.removeItem('peoplepay_user')
    sessionStorage.removeItem('peoplepay_role')
    setToken(null)
    setUser(null)
    setRoleState(ROLES.EMPLOYEE)
    setActiveModule(MODULES.EMPLOYEES)
  }

  const canAccessModule = (moduleId) => {
    const currentRole = mapToStandardRole(role)
    const allowed = ROLE_ALLOWED_MODULES[currentRole] || []
    return allowed.includes(moduleId)
  }

  const isRole = (...targetRoles) => {
    const currentRole = mapToStandardRole(role)
    return targetRoles.some(r => mapToStandardRole(r) === currentRole)
  }

  return (
    <AuthContext.Provider value={{
      token,
      user,
      role: mapToStandardRole(role),
      employeeId,
      isAuthenticated: Boolean(token),
      setAuth,
      logout,
      activeModule,
      setActiveModule,
      canAccessModule,
      isRole,
    }}>
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
