import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Login from './pages/Login/Login.jsx'
import Users from './pages/Users/Users.jsx'
import Employees from './pages/Employees/Employees.jsx'
import Contracts from './pages/Contracts/Contracts.jsx'
import Schedules from './pages/Schedules/Schedules.jsx'
import Attendance from './pages/Attendance/Attendance.jsx'
import TimeOff from './pages/TimeOff/TimeOff.jsx'
import Payroll from './pages/Payroll/Payroll.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/employees" replace /> },
      { path: 'users', element: <Users /> },
      { path: 'employees', element: <Employees /> },
      { path: 'contracts', element: <Contracts /> },
      { path: 'schedules', element: <Schedules /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'time-off', element: <TimeOff /> },
      { path: 'payroll', element: <Payroll /> },
    ],
  },
])

export default router