import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, MoreHorizontal, CheckCircle2, Loader2 } from 'lucide-react'
import { employeesApi } from '../../api/client.js'
import './Attendance.css'

const initialAttendanceData = [
  { attendance_id: 'A-001', employee_id: 'E-001', employeeName: 'Rishika Giri', email: 'rishika@peoplepay360.com', date: '2023-10-01', checkIn: '08:55 AM', checkOut: '05:05 PM', workedHours: '8h 10m', status: 'PRESENT' },
  { attendance_id: 'A-002', employee_id: 'E-002', employeeName: 'Chit Brahmbhatt', email: 'chit@peoplepay360.com', date: '2023-10-01', checkIn: '09:15 AM', checkOut: '06:00 PM', workedHours: '8h 45m', status: 'LATE' },
  { attendance_id: 'A-003', employee_id: 'E-003', employeeName: 'Ansh Vaghela', email: 'ansh@peoplepay360.com', date: '2023-10-01', checkIn: '--', checkOut: '--', workedHours: '0h 0m', status: 'ABSENT' },
  { attendance_id: 'A-004', employee_id: 'E-005', employeeName: 'Rahul Mehta', email: 'rahul@peoplepay360.com', date: '2023-10-01', checkIn: '08:00 AM', checkOut: '07:30 PM', workedHours: '11h 30m', status: 'OVERTIME' },
  { attendance_id: 'A-005', employee_id: 'E-006', employeeName: 'Priya Desai', email: 'priya@peoplepay360.com', date: '2023-10-01', checkIn: '09:00 AM', checkOut: '--', workedHours: '--', status: 'MISSING_CHECKOUT' },
]

const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '--'
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
  const [h, m] = timeStr.split(':')
  let hours = parseInt(h, 10)
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${String(hours).padStart(2, '0')}:${m || '00'} ${ampm}`
}

const computeWorkedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '--'
  const [inH, inM] = checkIn.split(':').map(Number)
  const [outH, outM] = checkOut.split(':').map(Number)
  if (isNaN(inH) || isNaN(outH)) return '--'
  
  let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM)
  if (totalMinutes < 0) totalMinutes += 24 * 60 // crosses midnight
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

function Attendance() {
  const [attendanceList, setAttendanceList] = useState(initialAttendanceData)
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [dateFilter, setDateFilter] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const initialForm = {
    employee_id: '',
    date: todayStr,
    checkIn: '09:00',
    checkOut: '17:00',
    status: 'PRESENT'
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    // Load employees for selection dropdown
    const loadEmps = async () => {
      try {
        const res = await employeesApi.getAll()
        const raw = Array.isArray(res) ? res : (res?.data || res?.items || [])
        if (raw.length > 0) {
          setEmployees(raw)
        }
      } catch {
        setEmployees([
          { id: 'E-001', full_name: 'Rahul Patel', email: 'rahul.patel@peoplepay360.demo' },
          { id: 'E-002', full_name: 'Priya Shah', email: 'priya.shah@peoplepay360.demo' },
          { id: 'E-003', full_name: 'Amit Mehta', email: 'amit.mehta@peoplepay360.demo' },
        ])
      }
    }
    loadEmps()
  }, [])

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        record.email.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || record.status === statusFilter

      const matchesDate = !dateFilter || record.date === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [attendanceList, search, statusFilter, dateFilter])

  const handleOpenModal = () => {
    setModalError('')
    setFormData({
      ...initialForm,
      employee_id: employees.length > 0 ? employees[0].id : ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setModalError('')

    if (!formData.employee_id) {
      setModalError('Please select an employee.')
      return
    }
    if (!formData.date) {
      setModalError('Date is required.')
      return
    }

    setSubmitting(true)

    const selectedEmp = employees.find(emp => String(emp.id) === String(formData.employee_id))
    const workedHours = formData.status === 'ABSENT' 
      ? '0h 0m' 
      : computeWorkedHours(formData.checkIn, formData.checkOut)

    const newRecord = {
      attendance_id: `A-${Date.now().toString().slice(-4)}`,
      employee_id: formData.employee_id,
      employeeName: selectedEmp?.full_name || selectedEmp?.name || 'Selected Employee',
      email: selectedEmp?.email || '',
      date: formData.date,
      checkIn: formData.status === 'ABSENT' ? '--' : formatTimeDisplay(formData.checkIn),
      checkOut: formData.status === 'ABSENT' ? '--' : formatTimeDisplay(formData.checkOut),
      workedHours: workedHours,
      status: formData.status
    }

    setTimeout(() => {
      setAttendanceList(prev => [newRecord, ...prev])
      setIsModalOpen(false)
      setSubmitting(false)
      setSuccessMsg('Attendance logged successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    }, 300)
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Attendance</h1>
          <p>Monitor employee attendance and working hours</p>
        </div>

        <button className="primary-button" onClick={handleOpenModal}>
          <Plus size={18} />
          Log Attendance
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="attendance-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <input 
          type="date" 
          className="date-input"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)} 
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="ABSENT">Absent</option>
          <option value="OVERTIME">Overtime</option>
          <option value="MISSING_CHECKOUT">Missing Checkout</option>
        </select>
      </div>

      <div className="attendance-table-card">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Worked Hours</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredAttendance.map((record) => (
              <tr key={record.attendance_id}>
                <td>
                  <div className="employee-cell">
                    <div className="avatar">
                      {record.employeeName
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <strong>{record.employeeName}</strong>
                      <span>{record.email}</span>
                    </div>
                  </div>
                </td>
                <td>{record.date}</td>
                <td>{record.checkIn}</td>
                <td>{record.checkOut}</td>
                <td>{record.workedHours}</td>
                <td>
                  <span className={`status status-${record.status.toLowerCase().replace('_', '-')}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button className="icon-button" aria-label="Attendance actions">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAttendance.length === 0 && (
          <div className="empty-state">No attendance records found.</div>
        )}
      </div>

      {/* Log Attendance Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Log Attendance</h2>
            {modalError && <div className="modal-error">{modalError}</div>}

            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label>Employee *</label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
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
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="OVERTIME">Overtime</option>
                    <option value="ABSENT">Absent</option>
                    <option value="MISSING_CHECKOUT">Missing Checkout</option>
                  </select>
                </div>
              </div>

              {formData.status !== 'ABSENT' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Check In Time</label>
                    <input
                      type="time"
                      value={formData.checkIn}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Check Out Time</label>
                    <input
                      type="time"
                      value={formData.checkOut}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

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
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance
