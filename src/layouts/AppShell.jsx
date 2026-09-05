import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Sun, Moon, UserCheck, LogOut } from 'lucide-react'
import { useAuth, ROLES, ROLE_DEFAULT_ROUTES } from '../context/AuthContext.jsx'
import './AppShell.css'

const ALL_NAV_ITEMS = [
  { to: '/employees', label: 'Employees' },
  { to: '/contracts', label: 'Contracts' },
  { to: '/schedules', label: 'Working Schedule' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/time-off', label: 'Time Off' },
  { to: '/payroll', label: 'Payroll' },
]

function AppShell() {
  const { role, setRole, canAccessRoute } = useAuth()
  const navigate = useNavigate()

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('peoplepay_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('peoplepay_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleRoleChange = (e) => {
    const newRole = e.target.value
    setRole(newRole)
    const fallback = ROLE_DEFAULT_ROUTES[newRole] || '/employees'
    navigate(fallback)
  }

  const handleLogout = () => {
    navigate('/login')
  }

  // Filter navigation items based on current role permissions
  const visibleNavItems = ALL_NAV_ITEMS.filter(item => canAccessRoute(item.to))

  return (
    <div id="app-shell">
      <header id="app-header">
        <span className="brand">PeoplePay360</span>

        <nav id="app-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mock Role Switcher in Header */}
        <div className="header-role-switcher" title="Active Role (RBAC)">
          <UserCheck size={16} className="role-icon" />
          <select 
            value={role} 
            onChange={handleRoleChange}
            className="role-select"
            aria-label="Current Role"
          >
            <option value={ROLES.EMPLOYEE}>Employee</option>
            <option value={ROLES.HR_MANAGER}>HR Manager</option>
            <option value={ROLES.HR_PAYROLL_USER}>HR Payroll User</option>
            <option value={ROLES.HR_PAYROLL_MANAGER}>HR Payroll Manager</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
        </div>

        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {canAccessRoute('/users') && (
          <NavLink to="/users" id="users-link" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            User Management
          </NavLink>
        )}

        <button 
          onClick={handleLogout} 
          className="header-logout-btn" 
          title="Sign Out to Login Page"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main id="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell