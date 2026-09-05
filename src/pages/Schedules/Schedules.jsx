import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, MoreHorizontal, AlertCircle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react'
import { schedulesApi } from '../../api/client.js'
import './Schedules.css'

const initialSchedulesData = [
  { schedule_id: 'SCH-001', name: 'Standard Shift', workingDays: 'Mon - Fri', startTime: '09:00 AM', endTime: '05:00 PM', breakDuration: '1 Hour', employeeCount: 15, status: 'Active' },
  { schedule_id: 'SCH-002', name: 'Night Shift', workingDays: 'Mon - Fri', startTime: '10:00 PM', endTime: '06:00 AM', breakDuration: '1 Hour', employeeCount: 8, status: 'Active' },
  { schedule_id: 'SCH-003', name: 'Weekend Support', workingDays: 'Sat - Sun', startTime: '08:00 AM', endTime: '04:00 PM', breakDuration: '30 Mins', employeeCount: 4, status: 'Inactive' },
  { schedule_id: 'SCH-004', name: 'Part-time Morning', workingDays: 'Mon, Wed, Fri', startTime: '08:00 AM', endTime: '12:00 PM', breakDuration: '15 Mins', employeeCount: 6, status: 'Active' },
]

const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '--'
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
  // Convert HH:MM:SS or HH:MM to 12-hour
  const [h, m] = timeStr.split(':')
  let hours = parseInt(h, 10)
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${String(hours).padStart(2, '0')}:${m || '00'} ${ampm}`
}

const normalizeSchedule = (item) => {
  const days = Array.isArray(item.working_days)
    ? item.working_days.join(', ')
    : (item.workingDays || 'Mon - Fri')

  const startTime = formatTimeDisplay(item.start_time || item.startTime)
  const endTime = formatTimeDisplay(item.end_time || item.endTime)
  const isActive = item.is_active !== undefined ? item.is_active : (item.status === 'Active')

  return {
    schedule_id: item.id || item.schedule_id || `SCH-${Date.now()}`,
    name: item.name || 'Custom Schedule',
    workingDays: days,
    startTime: startTime,
    endTime: endTime,
    breakDuration: item.break_duration || item.breakDuration || '1 Hour',
    employeeCount: item.employee_count !== undefined ? item.employee_count : (item.employeeCount || 0),
    status: isActive ? 'Active' : 'Inactive',
  }
}

function Schedules() {
  const [schedulesList, setSchedulesList] = useState(initialSchedulesData)
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
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    break_duration: '1 Hour',
    is_active: true
  }
  const [formData, setFormData] = useState(initialForm)

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const fetchSchedules = async () => {
    setLoading(true)
    setApiNotice('')

    try {
      const res = await schedulesApi.getAll()
      const rawSchedules = Array.isArray(res) ? res : (res?.data || res?.items || null)

      if (rawSchedules && rawSchedules.length > 0) {
        setSchedulesList(rawSchedules.map(normalizeSchedule))
      } else if (rawSchedules && rawSchedules.length === 0) {
        // Backend returned empty list, show initial mock data so view isn't empty
        setSchedulesList(initialSchedulesData)
      }
    } catch (err) {
      console.warn('Schedules API unavailable, using local mock data:', err.message)
      setApiNotice('Backend schedules service is currently operating in fallback mode.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const filteredSchedules = useMemo(() => {
    return schedulesList.filter((schedule) => {
      const matchesSearch =
        schedule.name.toLowerCase().includes(search.toLowerCase()) ||
        schedule.workingDays.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All Statuses' || schedule.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [schedulesList, search, statusFilter])

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const current = prev.working_days
      if (current.includes(day)) {
        return { ...prev, working_days: current.filter(d => d !== day) }
      } else {
        return { ...prev, working_days: [...current, day] }
      }
    })
  }

  const handleOpenModal = () => {
    setModalError('')
    setFormData(initialForm)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!formData.name.trim()) {
      setModalError('Schedule Name is required.')
      return
    }
    if (!formData.start_time || !formData.end_time) {
      setModalError('Start time and End time are required.')
      return
    }
    if (formData.working_days.length === 0) {
      setModalError('Please select at least one working day.')
      return
    }

    setSubmitting(true)

    // Ensure format "HH:MM:SS"
    const startTimeFormatted = formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time
    const endTimeFormatted = formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time

    const payload = {
      name: formData.name.trim(),
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      working_days: formData.working_days,
      is_active: formData.is_active
    }

    try {
      const res = await schedulesApi.create(payload)
      const createdSchedule = res?.data || res
      const normalized = normalizeSchedule(createdSchedule)

      setSchedulesList(prev => [normalized, ...prev])
      setIsModalOpen(false)
      setSuccessMsg('Schedule added successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.warn('POST /schedules/ failed, saving to local state:', err.message)
      // Fallback local addition
      const localSchedule = {
        schedule_id: `SCH-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        workingDays: formData.working_days.map(d => d.slice(0, 3)).join(', '),
        startTime: formatTimeDisplay(formData.start_time),
        endTime: formatTimeDisplay(formData.end_time),
        breakDuration: formData.break_duration,
        employeeCount: 0,
        status: formData.is_active ? 'Active' : 'Inactive',
      }

      setSchedulesList(prev => [localSchedule, ...prev])
      setIsModalOpen(false)
      setSuccessMsg('Schedule added successfully (local mode)!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="schedules-page">
      <div className="schedules-header">
        <div>
          <h1>Working Schedule</h1>
          <p>Manage employee working hours and shifts</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="secondary-button"
            onClick={fetchSchedules}
            title="Refresh schedules"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
          <button className="primary-button" onClick={handleOpenModal}>
            <Plus size={18} />
            Add Schedule
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
        {loading && schedulesList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={30} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p>Loading schedules...</p>
          </div>
        ) : (
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
        )}

        {!loading && filteredSchedules.length === 0 && (
          <div className="empty-state">No schedules found.</div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Schedule</h2>
            {modalError && <div className="modal-error">{modalError}</div>}

            <form onSubmit={handleSubmit} className="employee-form">
              <div className="form-group">
                <label>Schedule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Shift"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Working Days *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {ALL_DAYS.map(day => {
                    const isChecked = formData.working_days.includes(day)
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid var(--primary)' : '1px solid var(--input-border)',
                          background: isChecked ? 'var(--btn-active-bg)' : 'var(--input-bg)',
                          color: isChecked ? 'var(--primary)' : 'var(--text-main)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: isChecked ? '600' : '400'
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Break Duration</label>
                  <select
                    value={formData.break_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_duration: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="15 Mins">15 Mins</option>
                    <option value="30 Mins">30 Mins</option>
                    <option value="45 Mins">45 Mins</option>
                    <option value="1 Hour">1 Hour</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.is_active ? 'Active' : 'Inactive'}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'Active' }))}
                    disabled={submitting}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedules
