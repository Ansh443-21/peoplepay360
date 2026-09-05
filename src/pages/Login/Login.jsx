import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, mapToStandardRole, MODULES } from '../../context/AuthContext.jsx'
import { authApi } from '../../api/client.js'
import { LogoBrand } from '../../components/Logo.jsx'
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Sun, Moon } from 'lucide-react'
import './Login.css'

function Login() {
  const { setAuth, setActiveModule } = useAuth()
  const navigate = useNavigate()

  // Theme support consistent with AppShell
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('peoplepay_theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('peoplepay_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Screen modes: 'login' | 'forgot_request' | 'forgot_reset'
  const [mode, setMode] = useState('login')

  // Login form state
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Password reset state
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // --- 1. Login submission ---
  async function handleLoginSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both username/email and password.')
      return
    }

    setLoading(true)

    try {
      // POST /api/v1/auth/login with { identifier, password }
      const loginPayload = {
        identifier: identifier.trim(),
        password: password
      }

      const loginRes = await authApi.login(loginPayload)
      // IMPORTANT: access_token is top-level. Do NOT read data.access_token.
      const token = loginRes?.access_token

      if (!token) {
        throw new Error('No access_token returned in authentication response.')
      }

      // Store JWT in session storage for API client interceptor
      sessionStorage.setItem('peoplepay_token', token)

      // Call GET /api/v1/auth/me with Authorization: Bearer <token>
      let meRes = {}
      try {
        const meData = await authApi.getMe()
        meRes = meData || {}
      } catch (meErr) {
        console.warn('GET /auth/me call notice:', meErr.message)
        meRes = { role: loginRes?.role || 'EMPLOYEE' }
      }

      const userRole = mapToStandardRole(meRes.role || loginRes.role)
      const employeeId = meRes.employee_id || null

      setAuth({
        token,
        user: { ...meRes, role: userRole, employee_id: employeeId },
        role: userRole
      })

      // Always operate from /employees
      setActiveModule(MODULES.EMPLOYEES)
      navigate('/employees')
    } catch (err) {
      console.error('Login error:', err)
      if (err.response) {
        if (err.response.status === 401) {
          setErrorMsg('Invalid credentials. Please check your username and password.')
        } else if (err.response.status === 403) {
          setErrorMsg("You don't have permission")
        } else if (err.response.data?.detail) {
          const detail = typeof err.response.data.detail === 'string'
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
          setErrorMsg(detail)
        } else {
          setErrorMsg(`Login failed (HTTP ${err.response.status}). Please try again.`)
        }
      } else {
        setErrorMsg(err.message || 'Authentication request failed. Please check backend connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- 2. Password Reset Request ---
  async function handleResetRequestSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!resetIdentifier.trim()) {
      setErrorMsg('Please enter your username or email.')
      return
    }

    setLoading(true)

    try {
      // POST /api/v1/auth/password-reset/request { identifier }
      const res = await authApi.requestPasswordReset({ identifier: resetIdentifier.trim() })

      const devToken = res?.reset_token || res?.token || res?.data?.reset_token || ''
      if (devToken) {
        setResetToken(devToken)
      }

      setSuccessMsg('Password reset instructions processed. Please enter your reset token and new password.')
      setMode('forgot_reset')
    } catch (err) {
      console.warn('Password reset request error:', err)
      if (err.response?.data?.detail) {
        setErrorMsg(typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Failed to request reset.')
      } else {
        setSuccessMsg('Reset request submitted. Enter your reset token to proceed.')
        setMode('forgot_reset')
      }
    } finally {
      setLoading(false)
    }
  }

  // --- 3. Password Reset Confirm ---
  async function handleResetSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!resetToken.trim()) {
      setErrorMsg('Please enter your reset token.')
      return
    }
    if (!newPassword) {
      setErrorMsg('Please enter a new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // POST /api/v1/auth/password-reset
      await authApi.resetPassword({
        token: resetToken.trim(),
        new_password: newPassword
      })

      setSuccessMsg('Your password has been successfully reset! You can now log in.')
      setIdentifier(resetIdentifier)
      setPassword(newPassword)
      setMode('login')
    } catch (err) {
      console.warn('Password reset execution error:', err)
      if (err.response?.data?.detail) {
        setErrorMsg(typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Failed to reset password.')
      } else {
        setErrorMsg(err.message || 'Failed to reset password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="login-page">
      {/* Light / Dark Theme Toggle */}
      <div className="login-theme-toggle-wrapper">
        <button
          type="button"
          onClick={toggleTheme}
          className="login-theme-toggle"
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div id="login-card">
        <div className="login-brand-header">
          <LogoBrand size={32} fontSize="26px" />
        </div>

        {mode === 'login' && (
          <>
            <p className="subtitle">Sign in to your workplace portal.</p>

            {errorMsg && (
              <div className="login-status-banner error">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="login-status-banner success">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="login-form-group">
                <label htmlFor="identifier">Username or Email</label>
                <input
                  id="identifier"
                  type="text"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="login-form-group">
                <div className="login-label-row">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_request')
                      setResetIdentifier(identifier)
                      setErrorMsg('')
                      setSuccessMsg('')
                    }}
                    className="forgot-password-link"
                  >
                    Forgot Password?
                  </button>
                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading && <Loader2 size={16} className="spin-icon" style={{ marginRight: '8px' }} />}
                Sign In
              </button>
            </form>
          </>
        )}

        {mode === 'forgot_request' && (
          <>
            <p className="subtitle">Reset your account password.</p>

            {errorMsg && (
              <div className="login-status-banner error">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetRequestSubmit}>
              <div className="login-form-group">
                <label htmlFor="reset-id">Username or Email</label>
                <input
                  id="reset-id"
                  type="text"
                  placeholder="Enter your username or email"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading && <Loader2 size={16} className="spin-icon" style={{ marginRight: '8px' }} />}
                Request Password Reset
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setErrorMsg('')
                }}
                className="login-back-btn"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </form>
          </>
        )}

        {mode === 'forgot_reset' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <KeyRound size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Enter Reset Token</h2>
            </div>
            <p className="subtitle">Submit your reset token together with your new password.</p>

            {errorMsg && (
              <div className="login-status-banner error">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="login-status-banner success">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="login-form-group">
                <label htmlFor="reset-token">Reset Token *</label>
                <input
                  id="reset-token"
                  type="text"
                  placeholder="Paste your reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="new-password">New Password *</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="confirm-password">Confirm Password *</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading && <Loader2 size={16} className="spin-icon" style={{ marginRight: '8px' }} />}
                Reset Password & Log In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="login-back-btn"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default Login
