import { useState, useMemo } from 'react'
import { Search, Plus, Check, X } from 'lucide-react'
import './TimeOff.css'

const mockTypes = [
  { time_off_type_id: 'T1', name: 'Paid Time Off', description: 'Standard paid leave', defaultAllocation: '20 days' },
  { time_off_type_id: 'T2', name: 'Sick Leave', description: 'Medical leave', defaultAllocation: '10 days' },
  { time_off_type_id: 'T3', name: 'Unpaid Leave', description: 'Unpaid absence', defaultAllocation: 'Unlimited' },
]

const mockAllocations = [
  { id: 1, employee_id: 'E1', employeeName: 'Rishika Patel', typeName: 'Paid Time Off', allocation: 20, used: 5, balance: 15 },
  { id: 2, employee_id: 'E1', employeeName: 'Rishika Patel', typeName: 'Sick Leave', allocation: 10, used: 2, balance: 8 },
  { id: 3, employee_id: 'E2', employeeName: 'Chit Brahmbhatt', typeName: 'Paid Time Off', allocation: 20, used: 0, balance: 20 },
  { id: 4, employee_id: 'E3', employeeName: 'Ansh Vaghela', typeName: 'Paid Time Off', allocation: 20, used: 20, balance: 0 },
]

const initialRequests = [
  { id: 1, employee_id: 'E1', employeeName: 'Rishika Patel', time_off_type_id: 'T1', typeName: 'Paid Time Off', startDate: '2023-11-01', endDate: '2023-11-05', duration: '5 days', description: 'Family vacation', status: 'Approved' },
  { id: 2, employee_id: 'E2', employeeName: 'Chit Brahmbhatt', time_off_type_id: 'T2', typeName: 'Sick Leave', startDate: '2023-10-15', endDate: '2023-10-15', duration: '1 day', description: 'Fever', status: 'Pending' },
  { id: 3, employee_id: 'E3', employeeName: 'Ansh Vaghela', time_off_type_id: 'T1', typeName: 'Paid Time Off', startDate: '2023-12-20', endDate: '2023-12-31', duration: '12 days', description: 'Holiday travel', status: 'Refused' },
]

function TimeOff() {
  const [activeTab, setActiveTab] = useState('requests')
  
  // State for requests tab
  const [requests, setRequests] = useState(initialRequests)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const initialForm = {
    employeeName: '',
    time_off_type_id: 'T1',
    startDate: '',
    endDate: '',
    description: ''
  }
  const [formData, setFormData] = useState(initialForm)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!formData.employeeName || !formData.startDate || !formData.endDate) {
      setErrorMsg('Please fill in Employee, Start Date, and End Date.')
      return
    }

    const typeName = mockTypes.find(t => t.time_off_type_id === formData.time_off_type_id)?.name || 'Unknown'

    const newRequest = {
      id: Date.now(),
      employee_id: `E-${Date.now()}`,
      employeeName: formData.employeeName,
      time_off_type_id: formData.time_off_type_id,
      typeName: typeName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration: 'TBD',
      description: formData.description,
      status: 'Pending'
    }

    setRequests([newRequest, ...requests])
    setIsModalOpen(false)
    setFormData(initialForm)
  }

  const handleAction = (id, newStatus) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req))
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                            req.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All Statuses' || req.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [requests, search, statusFilter])

  return (
    <div className="timeoff-page">
      <div className="timeoff-header">
        <div>
          <h1>Time Off</h1>
          <p>Manage time-off requests, balances, and policies</p>
        </div>
        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Request Time Off
        </button>
      </div>

      <div className="timeoff-tabs">
        <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
          Requests
        </button>
        <button className={activeTab === 'allocations' ? 'active' : ''} onClick={() => setActiveTab('allocations')}>
          Balances & Allocations
        </button>
        <button className={activeTab === 'types' ? 'active' : ''} onClick={() => setActiveTab('types')}>
          Time Off Types
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="tab-content">
          <div className="timeoff-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search employees or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Refused</option>
            </select>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {req.employeeName.split(' ').map(p => p[0]).join('')}
                        </div>
                        <strong>{req.employeeName}</strong>
                      </div>
                    </td>
                    <td>{req.typeName}</td>
                    <td>{req.startDate} to {req.endDate}</td>
                    <td>{req.duration}</td>
                    <td className="description-cell">{req.description}</td>
                    <td>
                      <span className={`status status-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="actions-col">
                      {req.status === 'Pending' && (
                        <div className="action-buttons">
                          <button 
                            className="icon-button approve-btn" 
                            title="Approve"
                            onClick={() => handleAction(req.id, 'Approved')}
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            className="icon-button refuse-btn" 
                            title="Refuse"
                            onClick={() => handleAction(req.id, 'Refused')}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="empty-state">No time-off requests found.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="tab-content">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Total Allocation</th>
                  <th>Used</th>
                  <th>Available Balance</th>
                </tr>
              </thead>
              <tbody>
                {mockAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {alloc.employeeName.split(' ').map(p => p[0]).join('')}
                        </div>
                        <strong>{alloc.employeeName}</strong>
                      </div>
                    </td>
                    <td>{alloc.typeName}</td>
                    <td>{alloc.allocation} days</td>
                    <td>{alloc.used} days</td>
                    <td><strong>{alloc.balance} days</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'types' && (
        <div className="tab-content">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Type Name</th>
                  <th>Description</th>
                  <th>Default Allocation</th>
                </tr>
              </thead>
              <tbody>
                {mockTypes.map((type) => (
                  <tr key={type.time_off_type_id}>
                    <td><strong>{type.name}</strong></td>
                    <td>{type.description}</td>
                    <td>{type.defaultAllocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Request Time Off</h2>
            {errorMsg && <div className="modal-error">{errorMsg}</div>}
            
            <form onSubmit={handleSubmit} className="timeoff-form">
              <div className="form-group">
                <label>Employee Name *</label>
                <input 
                  type="text" 
                  name="employeeName" 
                  placeholder="e.g. Rishika Patel"
                  value={formData.employeeName} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Leave Type *</label>
                <select name="time_off_type_id" value={formData.time_off_type_id} onChange={handleInputChange}>
                  {mockTypes.map(t => (
                    <option key={t.time_off_type_id} value={t.time_off_type_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Description / Reason</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeOff