import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES, ROLE_DEFAULT_ROUTES } from '../../context/AuthContext.jsx'
import { ShieldCheck, Building2 } from 'lucide-react'
import './Login.css'

function Login() {
  const { role, setRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState(role || ROLES.ADMIN)
  const navigate = useNavigate()

  function handleRoleChange(newRole) {
    setSelectedRole(newRole)
    if (newRole === ROLES.EMPLOYEE) {
      setEmail('employee@peoplepay360.com')
    } else if (newRole === ROLES.HR_MANAGER) {
      setEmail('hr.manager@peoplepay360.com')
    } else if (newRole === ROLES.HR_PAYROLL_USER) {
      setEmail('payroll.user@peoplepay360.com')
    } else if (newRole === ROLES.HR_PAYROLL_MANAGER) {
      setEmail('payroll.manager@peoplepay360.com')
    } else {
      setEmail('admin@peoplepay360.com')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setRole(selectedRole)
    const landing = ROLE_DEFAULT_ROUTES[selectedRole] || '/employees'
    navigate(landing)
  }

  return (
    <div id="login-page">
      <form id="login-card" onSubmit={handleSubmit}>
        <div className="login-brand-header">
          <Building2 size={28} className="brand-icon" />
          <h1>PeoplePay360</h1>
        </div>
        <p className="subtitle">Sign in to your workplace portal.</p>

        {/* Mock Role Selector */}
        <div className="login-role-box">
          <label htmlFor="role-select" className="role-box-label">
            <ShieldCheck size={16} /> Select Mock Demo Role:
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="login-role-dropdown"
          >
            <option value={ROLES.EMPLOYEE}>1. Employee</option>
            <option value={ROLES.HR_MANAGER}>2. HR Manager</option>
            <option value={ROLES.HR_PAYROLL_USER}>3. HR Payroll User</option>
            <option value={ROLES.HR_PAYROLL_MANAGER}>4. HR Payroll Manager</option>
            <option value={ROLES.ADMIN}>5. Admin (Full Access)</option>
          </select>
          <div className="role-desc-preview">
            {selectedRole === ROLES.EMPLOYEE && 'Access: Profile/Employees, Attendance, Time Off, Payslips'}
            {selectedRole === ROLES.HR_MANAGER && 'Access: Employees, Contracts, Schedules, Attendance, Time Off'}
            {selectedRole === ROLES.HR_PAYROLL_USER && 'Access: Payroll Dashboard, Payruns, Payslips'}
            {selectedRole === ROLES.HR_PAYROLL_MANAGER && 'Access: Payroll Dashboard, Payruns, Payslips, Salary Structures'}
            {selectedRole === ROLES.ADMIN && 'Access: All modules including User Management'}
          </div>
        </div>

        <label htmlFor="email">Work email</label>
        <input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password || 'password123'}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Sign In as {selectedRole}</button>
        <p className="hint">Role-Based Access Control (RBAC) active for hackathon demo.</p>
      </form>
    </div>
  )
}

export default Login