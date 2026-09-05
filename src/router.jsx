import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Login from './pages/Login/Login.jsx'
import Users from './pages/Users/Users.jsx'
import Employees from './pages/employees/Employees.jsx'
import Contracts from './pages/Contracts/Contracts.jsx'
import Schedules from './pages/Schedules/Schedules.jsx'
import Attendance from './pages/attendance/Attendance.jsx'
import TimeOff from './pages/TimeOff/TimeOff.jsx'
import Payroll from './pages/payroll/Payroll.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

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
      {
        path: 'users',
        element: (
          <ProtectedRoute path="/users">
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute path="/employees">
            <Employees />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contracts',
        element: (
          <ProtectedRoute path="/contracts">
            <Contracts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schedules',
        element: (
          <ProtectedRoute path="/schedules">
            <Schedules />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attendance',
        element: (
          <ProtectedRoute path="/attendance">
            <Attendance />
          </ProtectedRoute>
        ),
      },
      {
        path: 'time-off',
        element: (
          <ProtectedRoute path="/time-off">
            <TimeOff />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payroll',
        element: (
          <ProtectedRoute path="/payroll">
            <Payroll />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export default router
