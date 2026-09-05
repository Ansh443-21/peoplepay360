import { useMemo, useState } from 'react'
import { Search, Plus, MoreHorizontal, Mail, LayoutGrid, List } from 'lucide-react'
import './Employees.css'

const employees = [
  { id: 1, name: 'Rishika Patel', role: 'HR Manager', department: 'Human Resources', email: 'rishika@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 2, name: 'Chit Brahmbhatt', role: 'Software Engineer', department: 'Engineering', email: 'chit@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 3, name: 'Ansh Vaghela', role: 'Frontend Developer', department: 'Engineering', email: 'ansh@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 4, name: 'Maya Shah', role: 'Finance Executive', department: 'Finance', email: 'maya@peoplepay360.com', status: 'Active', type: 'Full Time' },
  { id: 5, name: 'Rahul Mehta', role: 'Product Designer', department: 'Design', email: 'rahul@peoplepay360.com', status: 'Inactive', type: 'Contract' },
  { id: 6, name: 'Priya Desai', role: 'QA Engineer', department: 'Engineering', email: 'priya@peoplepay360.com', status: 'Active', type: 'Full Time' },
]

function Employees() {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All Departments')
  const [view, setView] = useState('list')

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.role.toLowerCase().includes(search.toLowerCase()) ||
        employee.email.toLowerCase().includes(search.toLowerCase())

      const matchesDepartment =
        department === 'All Departments' || employee.department === department

      return matchesSearch && matchesDepartment
    })
  }, [search, department])

  return (
    <div className="employees-page">
      <div className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees</p>
        </div>

        <button className="primary-button">
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
    </div>
  )
}

export default Employees
