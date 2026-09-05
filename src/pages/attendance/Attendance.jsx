import { useMemo, useState } from 'react'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import './Attendance.css'

const attendanceData = [
  { attendance_id: 'A-001', employee_id: 'E-001', employeeName: 'Rishika Patel', email: 'rishika@peoplepay360.com', date: '2023-10-01', checkIn: '08:55 AM', checkOut: '05:05 PM', workedHours: '8h 10m', status: 'PRESENT' },
  { attendance_id: 'A-002', employee_id: 'E-002', employeeName: 'Chit Brahmbhatt', email: 'chit@peoplepay360.com', date: '2023-10-01', checkIn: '09:15 AM', checkOut: '06:00 PM', workedHours: '8h 45m', status: 'LATE' },
  { attendance_id: 'A-003', employee_id: 'E-003', employeeName: 'Ansh Vaghela', email: 'ansh@peoplepay360.com', date: '2023-10-01', checkIn: '--', checkOut: '--', workedHours: '0h 0m', status: 'ABSENT' },
  { attendance_id: 'A-004', employee_id: 'E-005', employeeName: 'Rahul Mehta', email: 'rahul@peoplepay360.com', date: '2023-10-01', checkIn: '08:00 AM', checkOut: '07:30 PM', workedHours: '11h 30m', status: 'OVERTIME' },
  { attendance_id: 'A-005', employee_id: 'E-006', employeeName: 'Priya Desai', email: 'priya@peoplepay360.com', date: '2023-10-01', checkIn: '09:00 AM', checkOut: '--', workedHours: '--', status: 'MISSING_CHECKOUT' },
]

function Attendance() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [dateFilter, setDateFilter] = useState('')

  const filteredAttendance = useMemo(() => {
    return attendanceData.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        record.email.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || record.status === statusFilter
        
      const matchesDate = !dateFilter || record.date === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [search, statusFilter, dateFilter])

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Attendance</h1>
          <p>Monitor employee attendance and working hours</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Log Attendance
        </button>
      </div>

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
                        .join('')}
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
    </div>
  )
}

export default Attendance