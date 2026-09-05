import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, MoreHorizontal, AlertCircle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { contractsApi, employeesApi } from '../../api/client.js'
import './Contracts.css'

const initialContractsData = [
  { contract_id: 'C-001', employee_id: 'E-001', employeeName: 'Rishika Giri', email: 'rishika@peoplepay360.com', role: 'HR Manager', department_id: 'D-001', departmentName: 'Human Resources', wage: '$85,000/yr', startDate: '2023-01-15', endDate: '2025-01-14', status: 'Active', salary_structure_id: 'S-001' },
  { contract_id: 'C-002', employee_id: 'E-002', employeeName: 'Chit Brahmbhatt', email: 'chit@peoplepay360.com', role: 'Software Engineer', department_id: 'D-002', departmentName: 'Engineering', wage: '$95,000/yr', startDate: '2023-03-01', endDate: '2025-02-28', status: 'Active', salary_structure_id: 'S-002' },
  { contract_id: 'C-003', employee_id: 'E-003', employeeName: 'Ansh Vaghela', email: 'ansh@peoplepay360.com', role: 'Frontend Developer', department_id: 'D-002', departmentName: 'Engineering', wage: '$90,000/yr', startDate: '2023-06-10', endDate: '2025-06-09', status: 'Active', salary_structure_id: 'S-002' },
  { contract_id: 'C-004', employee_id: 'E-005', employeeName: 'Rahul Mehta', email: 'rahul@peoplepay360.com', role: 'Product Designer', department_id: 'D-004', departmentName: 'Design', wage: '$60/hr', startDate: '2023-08-01', endDate: '2024-01-31', status: 'Expired', salary_structure_id: 'S-003' },
]

const normalizeContract = (item, employeeMap = {}) => {
  const emp = employeeMap[item.employee_id] || {}
  const empName = item.employee_name || item.employeeName || emp.full_name || emp.name || 'Employee'
  const empEmail = item.employee_email || item.email || emp.email || ''
  const role = item.role || item.job_position || emp.job_position || emp.role || 'Staff'
  const dept = item.department_name || item.departmentName || emp.department_name || emp.department || 'General'

  let wageDisplay = item.wage ? (typeof item.wage === 'number' ? `$${item.wage.toLocaleString()}/yr` : String(item.wage)) : '$0'
  if (typeof item.wage === 'string' && !item.wage.includes('$')) {
    const num = parseFloat(item.wage)
    if (!isNaN(num)) {
      wageDisplay = `$${num.toLocaleString()}/yr`
    }
  }

  const statusRaw = item.status || 'Active'
  const statusFormatted = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase()

  return {
    contract_id: item.id || item.contract_id || `C-${Date.now()}`,
    employee_id: item.employee_id,
    employeeName: empName,
    email: empEmail,
    role: role,
    departmentName: dept,
    wage: wageDisplay,
    startDate: item.start_date || item.startDate || '',
    endDate: item.end_date || item.endDate || 'Ongoing',
    status: statusFormatted,
    salary_structure_id: item.salary_structure_id,
    contract_type: item.contract_type || 'Full Time',
  }
}

function Contracts() {
  const [contractsList, setContractsList] = useState(initialContractsData)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiNotice, setApiNotice] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const initialForm = {
    employee_id: '',
    salary_structure_id: '00000000-0000-0000-0000-000000000001',
    wage: '',
    contract_type: 'Full Time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'ACTIVE'
  }
  const [formData, setFormData] = useState(initialForm)

  const fetchEmployeesAndContracts = async () => {
    setLoading(true)
    setApiNotice('')

    let empMap = {}

    try {
      const empRes = await employeesApi.getAll()
      const rawEmps = Array.isArray(empRes) ? empRes : (empRes?.data || empRes?.items || [])
      setEmployees(rawEmps)
      rawEmps.forEach(e => {
        empMap[e.id] = e
      })
    } catch {
      // Offline / fallback employees
      const fallbackEmps = [
        { id: 'E-001', full_name: 'Rahul Patel', email: 'rahul.patel@peoplepay360.demo', job_position: 'Software Engineer', department_name: 'Engineering' },
        { id: 'E-002', full_name: 'Priya Shah', email: 'priya.shah@peoplepay360.demo', job_position: 'HR Manager', department_name: 'Human Resources' },
        { id: 'E-003', full_name: 'Amit Mehta', email: 'amit.mehta@peoplepay360.demo', job_position: 'Finance Executive', department_name: 'Finance' },
      ]
      setEmployees(fallbackEmps)
      fallbackEmps.forEach(e => {
        empMap[e.id] = e
      })
    }

    try {
      const res = await contractsApi.getAll()
      const rawContracts = Array.isArray(res) ? res : (res?.data || res?.items || null)

      if (rawContracts && rawContracts.length > 0) {
        setContractsList(rawContracts.map(c => normalizeContract(c, empMap)))
      } else if (rawContracts && rawContracts.length === 0) {
        // Backend returned empty list, show initial mock data so view isn't empty, but note it
        setContractsList(initialContractsData)
      }
    } catch (err) {
      console.warn('Contracts API unavailable, using local mock data:', err.message)
      setApiNotice('Backend contracts service is currently operating in fallback mode.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployeesAndContracts()
  }, [])

  const filteredContracts = useMemo(() => {
    return contractsList.filter((contract) => {
      const matchesSearch =
        contract.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        contract.role.toLowerCase().includes(search.toLowerCase()) ||
        contract.departmentName.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || contract.status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [contractsList, search, statusFilter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = () => {
    setModalError('')
    setFormData({
      ...initialForm,
      employee_id: employees.length > 0 ? employees[0].id : ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!formData.employee_id) {
      setModalError('Please select an employee.')
      return
    }
    if (!formData.wage) {
      setModalError('Please enter a wage amount.')
      return
    }
    if (!formData.start_date) {
      setModalError('Please enter a contract start date.')
      return
    }

    setSubmitting(true)

    const selectedEmp = employees.find(emp => String(emp.id) === String(formData.employee_id))

    // Prepare API contract payload
    const numericWage = parseFloat(formData.wage.replace(/[^0-9.]/g, '')) || 50000

    const payload = {
      employee_id: formData.employee_id,
      salary_structure_id: formData.salary_structure_id,
      wage: numericWage,
      contract_type: formData.contract_type,
      start_date: formData.start_date,
      end_date: formData.end_date ? formData.end_date : null,
      status: formData.status
    }

    try {
      const res = await contractsApi.create(payload)
      const createdContract = res?.data || res
      const empMap = { [formData.employee_id]: selectedEmp }
      const normalized = normalizeContract(createdContract, empMap)

      setContractsList(prev => [normalized, ...prev])
      setIsModalOpen(false)
      setSuccessMsg('Contract created successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.warn('POST /contracts failed, falling back to local state:', err.message)
      // Local fallback contract
      const localContract = {
        contract_id: `C-${Date.now().toString().slice(-4)}`,
        employee_id: formData.employee_id,
        employeeName: selectedEmp?.full_name || selectedEmp?.name || 'Selected Employee',
        email: selectedEmp?.email || '',
        role: selectedEmp?.job_position || selectedEmp?.role || 'Position',
        departmentName: selectedEmp?.department_name || selectedEmp?.department || 'Department',
        wage: `$${numericWage.toLocaleString()}/yr`,
        startDate: formData.start_date,
        endDate: formData.end_date || 'Ongoing',
        status: formData.status.charAt(0).toUpperCase() + formData.status.slice(1).toLowerCase(),
        salary_structure_id: formData.salary_structure_id,
        contract_type: formData.contract_type
      }

      setContractsList(prev => [localContract, ...prev])
      setIsModalOpen(false)
      setSuccessMsg('Contract added successfully (local mode)!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <h1>Contracts</h1>
          <p>Manage employee contracts and agreements</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="secondary-button"
            onClick={fetchEmployeesAndContracts}
            title="Refresh contracts"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button className="primary-button" onClick={handleOpenModal}>
            <Plus size={18} />
            New Contract
          </button>
        </div>
      </div>

      {apiNotice && (
        <div className="api-notice-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <AlertCircle size={18} />
          <span>{apiNotice}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="contracts-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>All Statuses</option>
          <option>Active</option>
          <option>Expired</option>
          <option>Pending</option>
        </select>
      </div>

      <div className="contracts-table-card">
        {loading && contractsList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={30} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p>Loading contracts...</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Job Position</th>
                <th>Department</th>
                <th>Wage</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredContracts.map((contract) => (
                <tr key={contract.contract_id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">
                        {contract.employeeName
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <strong>{contract.employeeName}</strong>
                        <span>{contract.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{contract.role}</td>
                  <td>{contract.departmentName}</td>
                  <td>{contract.wage}</td>
                  <td>{contract.startDate}</td>
                  <td>{contract.endDate}</td>
                  <td>
                    <span className={`status ${contract.status.toLowerCase()}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td>
                    <button className="icon-button" aria-label="Contract actions">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredContracts.length === 0 && (
          <div className="empty-state">No contracts found.</div>
        )}
      </div>

      {/* New Contract Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>New Contract</h2>
            {modalError && <div className="modal-error">{modalError}</div>}

            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label>Employee *</label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  disabled={submitting}
                >
                  <option value="">Select an Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.name} ({emp.email || emp.job_position || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contract Type *</label>
                  <select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleInputChange}
                    disabled={submitting}
                  >
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Annual Wage / Salary ($) *</label>
                  <input
                    type="number"
                    name="wage"
                    placeholder="e.g. 85000"
                    value={formData.wage}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>End Date (Optional)</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
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
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="EXPIRED">Expired</option>
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
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contracts
