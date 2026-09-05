import { NavLink, Outlet } from 'react-router-dom'
import './AppShell.css'

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees' },
  { to: '/contracts', label: 'Contracts' },
  { to: '/schedules', label: 'Working Schedule' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/time-off', label: 'Time Off' },
  { to: '/payroll', label: 'Payroll' },
]

function AppShell() {
  return (
    <div id="app-shell">
      <header id="app-header">
        <span className="brand">HR Portal</span>
        <nav id="app-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/users" id="users-link" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          User Management
        </NavLink>
      </header>
      <main id="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell