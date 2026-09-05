import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, User, LogOut, Lock } from 'lucide-react'
import { useAuth, MODULES } from '../context/AuthContext.jsx'
import { LogoBrand } from '../components/Logo.jsx'
import Employees from '../pages/employees/Employees.jsx'
import Contracts from '../pages/Contracts/Contracts.jsx'
import Schedules from '../pages/Schedules/Schedules.jsx'
import Attendance from '../pages/attendance/Attendance.jsx'
import TimeOff from '../pages/TimeOff/TimeOff.jsx'
import Payroll from '../pages/payroll/Payroll.jsx'
import Users from '../pages/Users/Users.jsx'
import './AppShell.css'

const NAV_ITEMS = [
  { id: MODULES.EMPLOYEES, label: 'Employees' },
  { id: MODULES.CONTRACTS, label: 'Contracts' },
  { id: MODULES.SCHEDULES, label: 'Working Schedule' },
  { id: MODULES.ATTENDANCE, label: 'Attendance' },
  { id: MODULES.TIMEOFF, label: 'Time Off' },
  { id: MODULES.PAYROLL, label: 'Payroll' },
]

function AppShell() {
  const { role, user, logout, activeModule, setActiveModule, canAccessModule } = useAuth()
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSelectModule = (moduleId) => {
    setActiveModule(moduleId)
  }

  // Render view corresponding to current activeModule
  const renderCurrentView = () => {
    const isAllowed = canAccessModule(activeModule)

    if (!isAllowed) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--status-expired-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Lock size={32} style={{ color: 'var(--status-expired-text)' }} />
          </div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--text-heading)', fontSize: '24px' }}>
            You don't have permission
          </h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', maxWidth: '460px', fontSize: '14px' }}>
            Your current role (<strong>{role}</strong>) does not have permission to access this module.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setActiveModule(MODULES.EMPLOYEES)}
          >
            Return to Employees
          </button>
        </div>
      )
    }

    switch (activeModule) {
      case MODULES.EMPLOYEES:
        return <Employees />
      case MODULES.CONTRACTS:
        return <Contracts />
      case MODULES.SCHEDULES:
        return <Schedules />
      case MODULES.ATTENDANCE:
        return <Attendance />
      case MODULES.TIMEOFF:
        return <TimeOff />
      case MODULES.PAYROLL:
        return <Payroll />
      case MODULES.USERS:
        return <Users />
      default:
        return <Employees />
    }
  }

  return (
    <div id="app-shell">
      <header id="app-header">
        <div
          className="brand"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={() => setActiveModule(MODULES.EMPLOYEES)}
          title="PeoplePay360"
        >
          <LogoBrand size={26} fontSize="18px" />
        </div>

        {/* Visual navigation with ALL items present */}
        <nav id="app-nav">
          {NAV_ITEMS.map((item) => {
            const hasAccess = canAccessModule(item.id)
            const isActive = activeModule === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectModule(item.id)}
                className={`nav-item-btn ${isActive ? 'active' : ''} ${!hasAccess ? 'locked' : ''}`}
                title={!hasAccess ? "You don't have permission" : item.label}
              >
                {!hasAccess && <Lock size={12} style={{ marginRight: '5px', opacity: 0.7 }} />}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Authenticated User Badge */}
        <div className="header-role-switcher" title={`Authenticated as ${user?.username || user?.email || role}`}>
          <User size={16} className="role-icon" />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
            {user?.username ? `${user.username} (${role})` : role}
          </span>
        </div>

        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Management tab visible for all, locked if not admin */}
        <button
          type="button"
          id="users-link"
          onClick={() => handleSelectModule(MODULES.USERS)}
          className={`nav-item-btn ${activeModule === MODULES.USERS ? 'active' : ''} ${!canAccessModule(MODULES.USERS) ? 'locked' : ''}`}
          title={!canAccessModule(MODULES.USERS) ? "You don't have permission" : 'User Management'}
        >
          {!canAccessModule(MODULES.USERS) && <Lock size={12} style={{ marginRight: '5px', opacity: 0.7 }} />}
          User Management
        </button>

        <button 
          onClick={handleLogout} 
          className="header-logout-btn" 
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main id="app-content">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default AppShell
