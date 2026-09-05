import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Login from './pages/Login/Login.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/employees',
    element: <AppShell />,
  },
  {
    path: '*',
    element: <Navigate to="/employees" replace />,
  },
])

export default router
