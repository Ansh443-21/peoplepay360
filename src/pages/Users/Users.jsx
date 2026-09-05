import { useState } from 'react'
import { Plus, Search, Shield, UserCheck, Mail } from 'lucide-react'
import { ROLES } from '../../context/AuthContext.jsx'
import './Users.css'

const initialUsers = [
  { user_id: 'USR-001', name: 'System Administrator', email: 'admin@peoplepay360.com', role: ROLES.ADMIN, status: 'Active' },
  { user_id: 'USR-002', name: 'Rishika Giri', email: 'hr.manager@peoplepay360.com', role: ROLES.HR_MANAGER, status: 'Active' },
  { user_id: 'USR-003', name: 'Chit Brahmbhatt', email: 'payroll.manager@peoplepay360.com', role: ROLES.HR_PAYROLL_MANAGER, status: 'Active' },
  { user_id: 'USR-004', name: 'Ansh Vaghela', email: 'payroll.user@peoplepay360.com', role: ROLES.HR_PAYROLL_USER, status: 'Active' },
  { user_id: 'USR-005', name: 'Maya Shah', email: 'employee@peoplepay360.com', role: ROLES.EMPLOYEE, status: 'Active' }
]

function Users() {
  const [usersList, setUsersList] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: ROLES.EMPLOYEE })

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.user_id.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreateUser = (e) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email) return

    const user = {
      user_id: `USR-00${usersList.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active'
    }

    setUsersList([...usersList, user])
    setIsModalOpen(false)
    setNewUser({ name: '', email: '', role: ROLES.EMPLOYEE })
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Configure system accounts, assign RBAC access roles, and manage permissions</p>
        </div>
        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="users-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="users-role-select"
        >
          <option value="ALL">All Roles</option>
          <option value={ROLES.ADMIN}>Admin</option>
          <option value={ROLES.HR_MANAGER}>HR Manager</option>
          <option value={ROLES.HR_PAYROLL_MANAGER}>HR Payroll Manager</option>
          <option value={ROLES.HR_PAYROLL_USER}>HR Payroll User</option>
          <option value={ROLES.EMPLOYEE}>Employee</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>User ID</th>
              <th>Assigned Role</th>
              <th>Status</th>
              <th>Permissions Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.user_id}>
                <td>
                  <div className="employee-cell">
                    <div className="avatar">
                      {user.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <strong>{user.name}</strong>
                      <span className="cell-sub"><Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{user.email}</span>
                    </div>
                  </div>
                </td>
                <td><span className="code-badge">{user.user_id}</span></td>
                <td>
                  <span className="role-badge">
                    <Shield size={13} />
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className="status status-active">
                    {user.status}
                  </span>
                </td>
                <td className="permissions-cell">
                  {user.role === ROLES.ADMIN && 'Full Access (All Modules)'}
                  {user.role === ROLES.HR_MANAGER && 'Employees, Contracts, Schedules, Attendance, Time Off'}
                  {user.role === ROLES.HR_PAYROLL_MANAGER && 'Payroll Dashboard, Payruns, Payslips, Structures'}
                  {user.role === ROLES.HR_PAYROLL_USER && 'Payroll Dashboard, Payruns, Payslips'}
                  {user.role === ROLES.EMPLOYEE && 'Profile, Attendance, Time Off, Personal Payslips'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="empty-state">No users found.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Portal User</h2>
            <form onSubmit={handleCreateUser} className="payroll-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Role Assignment *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value={ROLES.EMPLOYEE}>Employee</option>
                  <option value={ROLES.HR_MANAGER}>HR Manager</option>
                  <option value={ROLES.HR_PAYROLL_USER}>HR Payroll User</option>
                  <option value={ROLES.HR_PAYROLL_MANAGER}>HR Payroll Manager</option>
                  <option value={ROLES.ADMIN}>Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <UserCheck size={16} /> Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users