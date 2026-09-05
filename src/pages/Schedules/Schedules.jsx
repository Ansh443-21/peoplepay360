import { useMemo, useState } from 'react'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import './Schedules.css'

const schedulesData = [
  { schedule_id: 'SCH-001', name: 'Standard Shift', workingDays: 'Mon - Fri', startTime: '09:00 AM', endTime: '05:00 PM', breakDuration: '1 Hour', employeeCount: 15, status: 'Active' },
  { schedule_id: 'SCH-002', name: 'Night Shift', workingDays: 'Mon - Fri', startTime: '10:00 PM', endTime: '06:00 AM', breakDuration: '1 Hour', employeeCount: 8, status: 'Active' },
  { schedule_id: 'SCH-003', name: 'Weekend Support', workingDays: 'Sat - Sun', startTime: '08:00 AM', endTime: '04:00 PM', breakDuration: '30 Mins', employeeCount: 4, status: 'Inactive' },
  { schedule_id: 'SCH-004', name: 'Part-time Morning', workingDays: 'Mon, Wed, Fri', startTime: '08:00 AM', endTime: '12:00 PM', breakDuration: '15 Mins', employeeCount: 6, status: 'Active' },
]

function Schedules() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const filteredSchedules = useMemo(() => {
    return schedulesData.filter((schedule) => {
      const matchesSearch =
        schedule.name.toLowerCase().includes(search.toLowerCase()) ||
        schedule.workingDays.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || schedule.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  return (
    <div className="schedules-page">
      <div className="schedules-header">
        <div>
          <h1>Working Schedule</h1>
          <p>Manage employee working hours and shifts</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Schedule
        </button>
      </div>

      <div className="schedules-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search schedules..."
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
          <option>Inactive</option>
        </select>
      </div>

      <div className="schedules-table-card">
        <table>
          <thead>
            <tr>
              <th>Schedule Name</th>
              <th>Working Days</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Break Duration</th>
              <th>Employees</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredSchedules.map((schedule) => (
              <tr key={schedule.schedule_id}>
                <td>
                  <strong>{schedule.name}</strong>
                </td>
                <td>{schedule.workingDays}</td>
                <td>{schedule.startTime}</td>
                <td>{schedule.endTime}</td>
                <td>{schedule.breakDuration}</td>
                <td>{schedule.employeeCount}</td>
                <td>
                  <span className={`status ${schedule.status.toLowerCase()}`}>
                    {schedule.status}
                  </span>
                </td>
                <td>
                  <button className="icon-button" aria-label="Schedule actions">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSchedules.length === 0 && (
          <div className="empty-state">No schedules found.</div>
        )}
      </div>
    </div>
  )
}

export default Schedules