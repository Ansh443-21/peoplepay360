import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, MoreHorizontal, Mail, LayoutGrid, List, AlertCircle, RefreshCw, Loader2, Edit2, Lock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth, ROLES } from '../../context/AuthContext.jsx'
import { employeesApi } from '../../api/client.js'
import './Employees.css'

const initialMockEmployees = [
  { id: 1, employee_code: 'EMP-001', first_name: 'Rishika', last_name: 'Giri', full_name: 'Rishika Giri', name: 'Rishika Giri', role: 'HR Manager', job_position: 'HR Manager', department: 'Human Resources', department_name: 'Human Resources', email: 'rishika@peoplepay360.com', phone: '', status: 'Active', type: 'Full Time', employee_type: 'Full Time', joining_date: '2023-01-15' },
  { id: 2, employee_code: 'EMP-002', first_name: 'Chit', last_name: 'Brahmbhatt', full_name: 'Chit Brahmbhatt', name: 'Chit Brahmbhatt', role: 'Software Engineer', job_position: 'Software Engineer', department: 'Engineering', department_name: 'Engineering', email: 'chit@peoplepay360.com', phone: '', status: 'Active', type: 'Full Time', employee_type: 'Full Time', joining_date: '2023-02-01' },
  { id: 3, employee_code: 'EMP-003', first_name: 'Ansh', last_name: 'Vaghela', full_name: 'Ansh Vaghela', name: 'Ansh Vaghela', role: 'Frontend Developer', job_position: 'Frontend Developer', department: 'Engineering', department_name: 'Engineering', email: 'ansh@peoplepay360.com', phone: '', status: 'Active', type: 'Full Time', employee_type: 'Full Time', joining_date: '2023-03-10' },
  { id: 4, employee_code: 'EMP-004', first_name: 'Maya', last_name: 'Shah', full_name: 'Maya Shah', name: 'Maya Shah', role: 'Finance Executive', job_position: 'Finance Executive', department: 'Finance', department_name: 'Finance', email: 'maya@peoplepay360.com', phone: '', status: 'Active', type: 'Full Time', employee_type: 'Full Time', joining_date: '2023-04-05' },
  { id: 5, employee_code: 'EMP-005', first_name: 'Rahul', last_name: 'Mehta', full_name: 'Rahul Mehta', name: 'Rahul Mehta', role: 'Product Designer', job_position: 'Product Designer', department: 'Design', department_name: 'Design', email: 'rahul@peoplepay360.com', phone: '', status: 'Inactive', type: 'Contract', employee_type: 'Contract', joining_date: '2023-05-20' },
  { id: 6, employee_code: 'EMP-006', first_name: 'Priya', last_name: 'Desai', full_name: 'Priya Desai', name: 'Priya Desai', role: 'QA Engineer', job_position: 'QA Engineer', department: 'Engineering', department_name: 'Engineering', email: 'priya@peoplepay360.com', phone: '', status: 'Active', type: 'Full Time', employee_type: 'Full Time', joining_date: '2023-06-12' },
]

// Normalize API employee or mock employee into consistent view model
const normalizeEmployee = (emp) => {
  const firstName = emp.first_name || (emp.name ? emp.name.split(' ')[0] : '') || ''
  const lastName = emp.last_name || (emp.name ? emp.name.split(' ').slice(1).join(' ') : '') || ''
  const fullName = emp.full_name || (emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.name) || 'Unnamed'
  const jobPosition = emp.job_position || emp.role || 'Employee'

  let defaultDept = 'Engineering'
  const posLower = jobPosition.toLowerCase()
  if (posLower.includes('hr') || posLower.includes('human')) {
    defaultDept = 'Human Resources'
  } else if (posLower.includes('finance') || posLower.includes('account')) {
    defaultDept = 'Finance'
  } else if (posLower.includes('design') || posLower.includes('ui') || posLower.includes('ux')) {
    defaultDept = 'Design'
  }

  const departmentName = emp.department_name || emp.department || defaultDept
  const empType = emp.employee_type || emp.type || 'Full Time'
  const empStatus = emp.status ? (emp.status.charAt(0).toUpperCase() + emp.status.slice(1).toLowerCase()) : 'Active'

  return {
    ...emp,
    id: emp.id,
    employee_code: emp.employee_code || `EMP-${String(emp.id).padStart(3, '0')}`,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    name: fullName,
    department: departmentName,
    department_name: departmentName,
    role: jobPosition,
    job_position: jobPosition,
    type: empType,
    employee_type: empType,
    status: empStatus,
    email: emp.email || '',
    phone: emp.phone || '',
    joining_date: emp.joining_date || emp.joiningDate || '',
  }
}

function Employees() {
  const [employeeList, setEmployeeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [isFallback, setIsFallback] = useState(false)

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All Departments')
  const [view, setView] = useState('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null)

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

  // Fetch employees from API on mount - loads all backend records across pages
  const fetchEmployees = async () => {
    setLoading(true)
    setApiError(null)
    try {
      // 1. Fetch initial batch of up to 100 items (backend's maximum page_size)
      const firstRes = await employeesApi.getAll({ page: 1, page_size: 100 })
      
      let allItems = []
      const firstBatch = Array.isArray(firstRes)
        ? firstRes
        : Array.isArray(firstRes?.data)
        ? firstRes.data
        : Array.isArray(firstRes?.items)
        ? firstRes.items
        : null

      if (firstBatch) {
        allItems = [...firstBatch]
        const pagination = firstRes?.pagination
        const total = pagination?.total || allItems.length
        const totalPages = Math.ceil(total / 100)

        // 2. If there are more pages (e.g. 250 items total = 3 pages of 100), fetch remaining in parallel
        if (totalPages > 1) {
          const pagePromises = []
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(employeesApi.getAll({ page: p, page_size: 100 }))
          }
          const additionalResults = await Promise.allSettled(pagePromises)
          additionalResults.forEach((res) => {
            if (res.status === 'fulfilled') {
              const batch = Array.isArray(res.value)
                ? res.value
                : Array.isArray(res.value?.data)
                ? res.value.data
                : []
              allItems.push(...batch)
            }
          })
        }

        setEmployeeList(allItems.map(normalizeEmployee))
        setIsFallback(false)
      } else {
        // Fallback to local mock if data is unexpected
        setEmployeeList(initialMockEmployees.map(normalizeEmployee))
        setIsFallback(true)
      }
    } catch (err) {
      console.warn('Employees API unavailable, falling back to mock data:', err.message)
      setApiError(err.message || 'Failed to connect to backend server. Using offline data.')
      setIsFallback(true)
      // Keep existing list or ensure initialized with mock
      setEmployeeList((prev) => (prev.length > 0 ? prev : initialMockEmployees.map(normalizeEmployee)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const { role, employeeId, isRole } = useAuth()
  const isEmployeeRole = role === ROLES.EMPLOYEE
  const canAddEmployee = isRole(ROLES.HR, ROLES.ADMIN)

  // Dynamically collect unique departments from the loaded employee records
  const availableDepartments = useMemo(() => {
    const standardDepts = ['Human Resources', 'Engineering', 'Finance', 'Design']
    const loadedDepts = employeeList.map((e) => e.department).filter(Boolean)
    return Array.from(new Set([...standardDepts, ...loadedDepts]))
  }, [employeeList])

  // Filter employees by role, search keyword, and department
  const filteredEmployees = useMemo(() => {
    return employeeList.filter((employee) => {
      // If EMPLOYEE role, restrict to own profile
      if (isEmployeeRole && employeeId && String(employee.id) !== String(employeeId)) {
        return false
      }

      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        (employee.name && employee.name.toLowerCase().includes(q)) ||
        (employee.role && employee.role.toLowerCase().includes(q)) ||
        (employee.email && employee.email.toLowerCase().includes(q)) ||
        (employee.employee_code && employee.employee_code.toLowerCase().includes(q))

      const matchesDepartment =
        department === 'All Departments' || employee.department === department

      return matchesSearch && matchesDepartment
    })
  }, [employeeList, search, department, isEmployeeRole, employeeId])

  // Pagination calculation
  const totalEmployees = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedEmployees = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize
    return filteredEmployees.slice(startIdx, startIdx + pageSize)
  }, [filteredEmployees, safeCurrentPage, pageSize])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openAddModal = () => {
    setEditingEmployee(null)
    setFormData(initialForm)
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const openEditModal = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.first_name || (employee.name ? employee.name.split(' ')[0] : ''),
      lastName: employee.last_name || (employee.name ? employee.name.split(' ').slice(1).join(' ') : ''),
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || 'Engineering',
      role: employee.role || employee.job_position || '',
      type: employee.type || employee.employee_type || 'Full Time',
      joiningDate: employee.joining_date || '',
      status: employee.status || 'Active'
    })
    setErrorMsg('')
    setActionMenuOpenId(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      setErrorMsg('Please fill in all required fields (First Name, Last Name, Email, Position).')
      return
    }

    setSubmitting(true)

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      department_name: formData.department,
      job_position: formData.role.trim(),
      employee_type: formData.type,
      joining_date: formData.joiningDate || undefined,
      status: formData.status.toUpperCase(),
    }

    if (editingEmployee) {
      // PATCH /employees/{employee_id}
      try {
        const updated = await employeesApi.update(editingEmployee.id, payload)
        const updatedObj = (updated && updated.data) ? updated.data : updated
        const normalized = normalizeEmployee(updatedObj)
        setEmployeeList((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? normalized : emp))
        )
        setIsModalOpen(false)
      } catch (err) {
        console.warn('API update failed, updating local mock state:', err.message)
        // Fallback update locally
        const updatedLocal = normalizeEmployee({
          ...editingEmployee,
          ...payload,
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          role: formData.role.trim(),
          department: formData.department,
          type: formData.type,
          status: formData.status,
        })
        setEmployeeList((prev) =>
          prev.map((emp) => (emp.id === editingEmployee.id ? updatedLocal : emp))
        )
        setIsModalOpen(false)
      } finally {
        setSubmitting(false)
      }
    } else {
      // POST /employees
      try {
        const created = await employeesApi.create(payload)
        const createdObj = (created && created.data) ? created.data : created
        const normalized = normalizeEmployee(createdObj)
        setEmployeeList((prev) => [normalized, ...prev])
        setIsModalOpen(false)
        setFormData(initialForm)
      } catch (err) {
        console.warn('API create failed, adding to local mock state:', err.message)
        // Fallback add locally
        const newLocalEmp = normalizeEmployee({
          id: Date.now(),
          employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department_name: formData.department,
          department: formData.department,
          job_position: formData.role.trim(),
          role: formData.role.trim(),
          employee_type: formData.type,
          type: formData.type,
          status: formData.status,
          joining_date: formData.joiningDate || new Date().toISOString().split('T')[0],
        })
        setEmployeeList((prev) => [newLocalEmp, ...prev])
        setIsModalOpen(false)
        setFormData(initialForm)
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="employees-page">
      <div className="employees-header">
        <div>
          <h1>Employees</h1>
          <p>Manage your organization's employees</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="secondary-button"
            onClick={fetchEmployees}
            title="Refresh employees list from backend"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button
            className="primary-button"
            onClick={canAddEmployee ? openAddModal : undefined}
            disabled={!canAddEmployee}
            title={!canAddEmployee ? "You don't have permission" : "Add Employee"}
            style={!canAddEmployee ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {!canAddEmployee ? <Lock size={16} /> : <Plus size={18} />}
            Add Employee
          </button>
        </div>
      </div>

      {(apiError || isFallback) && (
        <div className="api-notice-banner">
          <AlertCircle size={18} className="notice-icon" />
          <div className="notice-text">
            <strong>Backend Connection: </strong>
            <span>{apiError ? `${apiError}. ` : ''}Operating in fallback demo mode.</span>
          </div>
        </div>
      )}

      <div className="employees-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <select
          value={department}
          onChange={(event) => {
            setDepartment(event.target.value)
            setCurrentPage(1)
          }}
        >
          <option>All Departments</option>
          {availableDepartments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
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

      {loading && employeeList.length === 0 ? (
        <div className="loading-state-card">
          <Loader2 size={32} className="spin-icon" />
          <p>Loading employees from server...</p>
        </div>
      ) : view === 'list' ? (
        <div className="employees-table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">
                        {(employee.name || 'Unnamed')
                          .split(' ')
                          .filter(Boolean)
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
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

                  <td style={{ position: 'relative' }}>
                    <button
                      className="icon-button"
                      aria-label="Employee actions"
                      onClick={() =>
                        setActionMenuOpenId(actionMenuOpenId === employee.id ? null : employee.id)
                      }
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {actionMenuOpenId === employee.id && (
                      <div className="actions-dropdown-menu">
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={() => openEditModal(employee)}
                        >
                          <Edit2 size={14} /> Edit Employee
                        </button>
                      </div>
                    )}
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
          {paginatedEmployees.map((employee) => (
            <div className="employee-card" key={employee.id}>
              <div className="card-top">
                <div className="avatar large">
                  {(employee.name || 'Unnamed')
                    .split(' ')
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    className="icon-button"
                    onClick={() =>
                      setActionMenuOpenId(actionMenuOpenId === employee.id ? null : employee.id)
                    }
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {actionMenuOpenId === employee.id && (
                    <div className="actions-dropdown-menu">
                      <button
                        type="button"
                        className="dropdown-menu-item"
                        onClick={() => openEditModal(employee)}
                      >
                        <Edit2 size={14} /> Edit Employee
                      </button>
                    </div>
                  )}
                </div>
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

          {filteredEmployees.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No employees found.</div>
          )}
        </div>
      )}

      {/* Pagination Bar */}
      {totalEmployees > 0 && (
        <div className="employees-pagination-bar">
          <div className="pagination-info">
            Showing <strong>{Math.min((safeCurrentPage - 1) * pageSize + 1, totalEmployees)}</strong> - <strong>{Math.min(safeCurrentPage * pageSize, totalEmployees)}</strong> of <strong>{totalEmployees}</strong> employees
          </div>

          <div className="pagination-controls">
            <div className="page-size-selector">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="pagination-nav-buttons">
              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span className="pagination-page-indicator">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="pagination-btn"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            {errorMsg && <div className="modal-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option>Human Resources</option>
                    <option>Engineering</option>
                    <option>Finance</option>
                    <option>Design</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Job Position *</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting && <Loader2 size={16} className="spin-icon" style={{ marginRight: '6px' }} />}
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
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
