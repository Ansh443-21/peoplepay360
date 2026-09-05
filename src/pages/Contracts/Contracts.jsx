import { useMemo, useState } from 'react'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import './Contracts.css'

const contractsData = [
  { contract_id: 'C-001', employee_id: 'E-001', employeeName: 'Rishika Giri', email: 'rishika@peoplepay360.com', role: 'HR Manager', department_id: 'D-001', departmentName: 'Human Resources', wage: '$85,000/yr', startDate: '2023-01-15', endDate: '2025-01-14', status: 'Active', salary_structure_id: 'S-001' },
  { contract_id: 'C-002', employee_id: 'E-002', employeeName: 'Chit Brahmbhatt', email: 'chit@peoplepay360.com', role: 'Software Engineer', department_id: 'D-002', departmentName: 'Engineering', wage: '$95,000/yr', startDate: '2023-03-01', endDate: '2025-02-28', status: 'Active', salary_structure_id: 'S-002' },
  { contract_id: 'C-003', employee_id: 'E-003', employeeName: 'Ansh Vaghela', email: 'ansh@peoplepay360.com', role: 'Frontend Developer', department_id: 'D-002', departmentName: 'Engineering', wage: '$90,000/yr', startDate: '2023-06-10', endDate: '2025-06-09', status: 'Active', salary_structure_id: 'S-002' },
  { contract_id: 'C-004', employee_id: 'E-005', employeeName: 'Rahul Mehta', email: 'rahul@peoplepay360.com', role: 'Product Designer', department_id: 'D-004', departmentName: 'Design', wage: '$60/hr', startDate: '2023-08-01', endDate: '2024-01-31', status: 'Expired', salary_structure_id: 'S-003' },
]

function Contracts() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const filteredContracts = useMemo(() => {
    return contractsData.filter((contract) => {
      const matchesSearch =
        contract.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        contract.role.toLowerCase().includes(search.toLowerCase()) ||
        contract.departmentName.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || contract.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <h1>Contracts</h1>
          <p>Manage employee contracts and agreements</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          New Contract
        </button>
      </div>

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
                        .join('')}
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

        {filteredContracts.length === 0 && (
          <div className="empty-state">No contracts found.</div>
        )}
      </div>
    </div>
  )
}

export default Contracts