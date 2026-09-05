import { useMemo, useState } from 'react'
import { Search, Plus, MoreHorizontal, Mail, LayoutGrid, List } from 'lucide-react'
import './Employees.css'

const initialEmployees = [
  { id: 1, name: 'Rishika Patel', role: 'HR Manager', department: 'Human Resources', email: 'rishika@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 2, name: 'Chit Brahmbhatt', role: 'Software Engineer', department: 'Engineering', email: 'chit@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 3, name: 'Ansh Vaghela', role: 'Frontend Developer', department: 'Engineering', email: 'ansh@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 4, name: 'Maya Shah', role: 'Finance Executive', department: 'Finance', email: 'maya@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 5, name: 'Rahul Mehta', role: 'Product Designer', department: 'Design', email: 'rahul@peoplepay360.com', status: 'Inactive', type: 'Contract' },
  { id: 6, name: 'Priya Desai', role: 'QA Engineer', department: 'Engineering', email: 'priya@peoplepay360.com', status: 'Active', type: 'Full Time' },
]

function Employees() {
  const [employeeList, setEmployeeList] = useState(initialEmployees)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All Departments')
  const [view, setView] = useState('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    role: '',
    type: 'Full Time',
    joiningDate: '',
    status: 'Active'
  }
  const [formData, setFormData] = useState(initialForm)

  const filteredEmployees = useMemo(() => {
    return employeeList.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.role.toLowerCase().includes(search.toLowerCase()) ||
        employee.email.toLowerCase().includes(search.toLowerCase())

      const matchesDepartment =
        department === 'All Departments' || employee.department === department

      return matchesSearch && matchesDepartment
    })
  }, [employeeList, search, department])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      setErrorMsg('Please fill in all required fields (First Name, Last Name, Email, Position).')
      return
    }

    const newEmployee = {
      id: Date.now(),
      name: `${formData.firstName} ${formData.lastName}`,
      role: formData.role,
      department: formData.department,
      email: formData.email,
      status: formData.status,
      type: formData.type
    }

    setEmployeeList((prev) => [...prev, newEmployee])
    setIsModalOpen(false)
    setFormData(initialForm)
  }

  return (
    <div className="employees-page">
      <div className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees</p>
        </div>

        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="employees-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option>All Departments</option>
          <option>Human Resources</option>
          <option>Engineering</option>
          <option>Finance</option>
          <option>Design</option>
        </select>

        <div className="view-toggle">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <List size={18} />
          </button>
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="employees-table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">
                        {employee.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </div>
                      <div>
                        <strong>{employee.name}</strong>
                        <span>{employee.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>{employee.department}</td>
                  <td>{employee.role}</td>
                  <td>{employee.type}</td>

                  <td>
                    <span className={`status ${employee.status.toLowerCase()}`}>
                      {employee.status}
                    </span>
                  </td>

                  <td>
                    <button className="icon-button" aria-label="Employee actions">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="empty-state">No employees found.</div>
          )}
        </div>
      ) : (
        <div className="employee-grid">
          {filteredEmployees.map((employee) => (
            <div className="employee-card" key={employee.id}>
              <div className="card-top">
                <div className="avatar large">
                  {employee.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <button className="icon-button">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <h3>{employee.name}</h3>
              <p className="role">{employee.role}</p>

              <span className={`status ${employee.status.toLowerCase()}`}>
                {employee.status}
              </span>

              <div className="card-info">
                <span><Mail size={15} /> {employee.email}</span>
                <span>{employee.department}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Employee</h2>
            {errorMsg && <div className="modal-error">{errorMsg}</div>}
            
            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange}>
                    <option>Human Resources</option>
                    <option>Engineering</option>
                    <option>Finance</option>
                    <option>Design</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Job Position *</label>
                  <input type="text" name="role" value={formData.role} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
