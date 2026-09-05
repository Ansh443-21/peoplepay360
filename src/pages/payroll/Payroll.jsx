import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  ChevronLeft,
  DollarSign,
  Users,
  CalendarCheck,
  Settings,
  Play,
  CheckCircle,
  CreditCard,
  Pencil,
  Trash2,
  Printer,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Send,
  ArrowRight,
  Check,
  TrendingUp,
  PieChart,
  Activity,
  Layers
} from 'lucide-react'
import { useAuth, ROLES } from '../../context/AuthContext.jsx'
import './Payroll.css'

const availableEmployees = [
  { employee_id: 'E1', name: 'Rishika Patel', role: 'HR Manager', department: 'Human Resources', basic: 5000 },
  { employee_id: 'E2', name: 'Chit Brahmbhatt', role: 'Software Engineer', department: 'Engineering', basic: 4500 },
  { employee_id: 'E3', name: 'Ansh Vaghela', role: 'Frontend Developer', department: 'Engineering', basic: 4800 },
  { employee_id: 'E4', name: 'Maya Shah', role: 'Finance Executive', department: 'Finance', basic: 7000 },
  { employee_id: 'E5', name: 'Rahul Mehta', role: 'Product Designer', department: 'Design', basic: 4200 },
  { employee_id: 'E6', name: 'Priya Desai', role: 'QA Engineer', department: 'Engineering', basic: 4600 }
]

const initialPayruns = [
  {
    payrun_id: 'PR-2023-10',
    period: 'October 2023',
    salary_structure_id: 'SS-1',
    employeeCount: 45,
    gross: 250000,
    deductions: 50000,
    net: 200000,
    status: 'PAID',
    warnings: [],
    payslipsSent: true
  },
  {
    payrun_id: 'PR-2023-11',
    period: 'November 2023',
    salary_structure_id: 'SS-1',
    employeeCount: 48,
    gross: 260000,
    deductions: 52000,
    net: 208000,
    status: 'VALIDATED',
    warnings: ['1 employee has an attendance discrepancy.'],
    payslipsSent: false
  },
  {
    payrun_id: 'PR-2023-12',
    period: 'December 2023',
    salary_structure_id: 'SS-1',
    employeeCount: 4,
    gross: 275000,
    deductions: 55000,
    net: 220000,
    status: 'DRAFT',
    warnings: ['Draft payrun has not been computed yet.'],
    payslipsSent: false
  }
]

const initialPayslips = [
  {
    payslip_id: 'PS-101',
    payrun_id: 'PR-2023-11',
    period: 'November 2023',
    employee_id: 'E1',
    employeeName: 'Rishika Patel',
    role: 'HR Manager',
    department: 'Human Resources',
    salary_structure_id: 'SS-1',
    structureName: 'Standard Full-Time',
    workedDays: 22,
    totalWorkingDays: 22,
    basic: 5000,
    allowances: [
      { name: 'House Rent Allowance (HRA)', amount: 1000, category: 'Allowance' },
      { name: 'Conveyance Allowance', amount: 300, category: 'Allowance' },
      { name: 'Medical Allowance', amount: 200, category: 'Allowance' }
    ],
    deductionsList: [
      { name: 'Income Tax (TDS)', amount: 850, category: 'Deduction' },
      { name: 'Provident Fund (PF)', amount: 450, category: 'Deduction' }
    ],
    gross: 6500,
    deductions: 1300,
    net: 5200,
    status: 'VALIDATED',
    warnings: []
  },
  {
    payslip_id: 'PS-102',
    payrun_id: 'PR-2023-11',
    period: 'November 2023',
    employee_id: 'E2',
    employeeName: 'Chit Brahmbhatt',
    role: 'Software Engineer',
    department: 'Engineering',
    salary_structure_id: 'SS-2',
    structureName: 'Standard Contract',
    workedDays: 20,
    totalWorkingDays: 22,
    basic: 4500,
    allowances: [
      { name: 'Project Performance Bonus', amount: 500, category: 'Allowance' }
    ],
    deductionsList: [
      { name: 'Tax Deducted at Source (TDS)', amount: 500, category: 'Deduction' },
      { name: 'Unpaid Absence (2 days)', amount: 409, category: 'Deduction' }
    ],
    gross: 5000,
    deductions: 909,
    net: 4091,
    status: 'VALIDATED',
    warnings: ['Attendance record shows 2 unapproved missing checkouts in this period.']
  },
  {
    payslip_id: 'PS-103',
    payrun_id: 'PR-2023-10',
    period: 'October 2023',
    employee_id: 'E3',
    employeeName: 'Ansh Vaghela',
    role: 'Frontend Developer',
    department: 'Engineering',
    salary_structure_id: 'SS-1',
    structureName: 'Standard Full-Time',
    workedDays: 21,
    totalWorkingDays: 21,
    basic: 4800,
    allowances: [
      { name: 'House Rent Allowance (HRA)', amount: 960, category: 'Allowance' },
      { name: 'Internet & Remote Work Stipend', amount: 150, category: 'Allowance' }
    ],
    deductionsList: [
      { name: 'Income Tax (TDS)', amount: 750, category: 'Deduction' },
      { name: 'Health Insurance', amount: 200, category: 'Deduction' }
    ],
    gross: 5910,
    deductions: 950,
    net: 4960,
    status: 'PAID',
    warnings: []
  },
  {
    payslip_id: 'PS-104',
    payrun_id: 'PR-2023-12',
    period: 'December 2023',
    employee_id: 'E4',
    employeeName: 'Maya Shah',
    role: 'Finance Executive',
    department: 'Finance',
    salary_structure_id: 'SS-1',
    structureName: 'Standard Full-Time',
    workedDays: 23,
    totalWorkingDays: 23,
    basic: 7000,
    allowances: [
      { name: 'House Rent Allowance (HRA)', amount: 1400, category: 'Allowance' },
      { name: 'Special Allowance', amount: 600, category: 'Allowance' }
    ],
    deductionsList: [
      { name: 'Income Tax (TDS)', amount: 1200, category: 'Deduction' },
      { name: 'Professional Tax', amount: 200, category: 'Deduction' }
    ],
    gross: 9000,
    deductions: 1400,
    net: 7600,
    status: 'DRAFT',
    warnings: ['Draft payrun not yet validated by HR finance admin.']
  }
]

const initialStructures = [
  { salary_structure_id: 'SS-1', name: 'Standard Full-Time', description: 'Base salary with standard allowances and deductions', baseSalary: 5000 },
  { salary_structure_id: 'SS-2', name: 'Standard Contract', description: 'Base salary with contract deductions', baseSalary: 4500 },
]

const initialRules = {
  'SS-1': [
    { rule_id: 'R1', code: 'BASIC', name: 'Basic Salary', category: 'Basic', amount: 'Base', type: 'Fixed' },
    { rule_id: 'R2', code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', amount: '20%', type: 'Percentage' },
    { rule_id: 'R3', code: 'TAX', name: 'Income Tax', category: 'Deduction', amount: '10%', type: 'Percentage' },
  ],
  'SS-2': [
    { rule_id: 'R4', code: 'BASIC', name: 'Basic Salary', category: 'Basic', amount: 'Base', type: 'Fixed' },
    { rule_id: 'R5', code: 'TDS', name: 'Tax Deducted at Source', category: 'Deduction', amount: '10%', type: 'Percentage' },
  ]
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

function Payroll() {
  const { isRole } = useAuth()

  // RBAC permissions for Payroll module
  const canViewStructures = isRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN)
  const canManagePayruns = isRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN)
  const isEmployeeOnly = isRole(ROLES.EMPLOYEE)

  // Default active tab based on role
  const [activeTab, setActiveTab] = useState(() => {
    if (isEmployeeOnly) return 'payslips'
    return 'dashboard'
  })

  // Payruns State
  const [payruns, setPayruns] = useState(initialPayruns)
  const [search, setSearch] = useState('')
  const [activePayrunId, setActivePayrunId] = useState(null)

  // Payrun Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // Step 1: Period + Structure, Step 2: Employee selection
  const [wizardPeriod, setWizardPeriod] = useState('')
  const [wizardStructureId, setWizardStructureId] = useState('SS-1')
  const [wizardSelectedEmployees, setWizardSelectedEmployees] = useState(['E1', 'E2', 'E3', 'E4'])
  const [wizardError, setWizardError] = useState('')

  // Notification Banner State
  const [notificationMsg, setNotificationMsg] = useState('')

  // Payslips State
  const [payslipsList, setPayslipsList] = useState(initialPayslips)
  const [payslipSearch, setPayslipSearch] = useState('')
  const [payslipStatusFilter, setPayslipStatusFilter] = useState('ALL')
  const [activePayslipId, setActivePayslipId] = useState(null)

  // Salary Structures State
  const [structures, setStructures] = useState(initialStructures)
  const [rules, setRules] = useState(initialRules)
  const [activeStructureId, setActiveStructureId] = useState(null)
  const [isStructModalOpen, setIsStructModalOpen] = useState(false)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  
  const [structForm, setStructForm] = useState({ name: '', description: '', baseSalary: '' })
  const [ruleForm, setRuleForm] = useState({ code: '', name: '', category: 'Allowance', amount: '', type: 'Fixed' })
  const [editingRuleId, setEditingRuleId] = useState(null)

  // Comprehensive Dashboard calculations
  const totalPaid = useMemo(() => {
    return payruns.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.net, 0)
  }, [payruns])

  const totalGrossPayroll = useMemo(() => {
    return payruns.reduce((sum, p) => sum + p.gross, 0)
  }, [payruns])

  const totalDeductionsAll = useMemo(() => {
    return payruns.reduce((sum, p) => sum + p.deductions, 0)
  }, [payruns])

  const totalNetPayroll = useMemo(() => {
    return payruns.reduce((sum, p) => sum + p.net, 0)
  }, [payruns])

  const latestPayrun = useMemo(() => {
    return payruns[0] || null
  }, [payruns])

  const nextDraft = useMemo(() => {
    return payruns.find(p => p.status !== 'PAID')
  }, [payruns])

  const totalEmployeesProcessed = useMemo(() => {
    return payruns.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0)
  }, [payruns])

  const payrunStatusCounts = useMemo(() => {
    const counts = { DRAFT: 0, COMPUTED: 0, VALIDATED: 0, PAID: 0 }
    payruns.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++
    })
    return counts
  }, [payruns])

  const recentPayrunsList = useMemo(() => {
    return payruns.slice(0, 4)
  }, [payruns])

  const recentPayslipsList = useMemo(() => {
    return payslipsList.slice(0, 4)
  }, [payslipsList])

  const filteredPayruns = useMemo(() => {
    return payruns.filter(pr => 
      pr.period.toLowerCase().includes(search.toLowerCase()) ||
      pr.payrun_id.toLowerCase().includes(search.toLowerCase())
    )
  }, [payruns, search])

  const filteredPayslips = useMemo(() => {
    return payslipsList.filter(ps => {
      const matchesSearch =
        ps.employeeName.toLowerCase().includes(payslipSearch.toLowerCase()) ||
        ps.payslip_id.toLowerCase().includes(payslipSearch.toLowerCase()) ||
        ps.payrun_id.toLowerCase().includes(payslipSearch.toLowerCase()) ||
        ps.period.toLowerCase().includes(payslipSearch.toLowerCase())
      
      const matchesStatus = payslipStatusFilter === 'ALL' || ps.status === payslipStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [payslipsList, payslipSearch, payslipStatusFilter])

  const activePayrun = payruns.find(p => p.payrun_id === activePayrunId)
  const activeStructure = structures.find(s => s.salary_structure_id === activeStructureId)
  const activeRules = activeStructure ? (rules[activeStructureId] || []) : []
  const activePayslip = payslipsList.find(p => p.payslip_id === activePayslipId)

  // --- Wizard Handlers ---
  const handleOpenWizard = () => {
    setWizardStep(1)
    setWizardPeriod('')
    setWizardStructureId(structures[0]?.salary_structure_id || 'SS-1')
    setWizardSelectedEmployees(availableEmployees.map(e => e.employee_id))
    setWizardError('')
    setIsWizardOpen(true)
  }

  const handleWizardNext = () => {
    if (!wizardPeriod.trim()) {
      setWizardError('Please specify the payroll period.')
      return
    }
    setWizardError('')
    setWizardStep(2)
  }

  const handleToggleEmployee = (id) => {
    if (wizardSelectedEmployees.includes(id)) {
      setWizardSelectedEmployees(wizardSelectedEmployees.filter(eId => eId !== id))
    } else {
      setWizardSelectedEmployees([...wizardSelectedEmployees, id])
    }
  }

  const handleToggleSelectAll = () => {
    if (wizardSelectedEmployees.length === availableEmployees.length) {
      setWizardSelectedEmployees([])
    } else {
      setWizardSelectedEmployees(availableEmployees.map(e => e.employee_id))
    }
  }

  const handleFinishCreatePayrun = () => {
    if (wizardSelectedEmployees.length === 0) {
      setWizardError('Please select at least one employee for this payrun.')
      return
    }

    const newPayrunId = `PR-${Date.now()}`
    const chosenStruct = structures.find(s => s.salary_structure_id === wizardStructureId)

    // Generate initial DRAFT payslips for the selected employees
    const createdSlips = wizardSelectedEmployees.map((empId, index) => {
      const empInfo = availableEmployees.find(e => e.employee_id === empId)
      const basicSalary = empInfo?.basic || chosenStruct?.baseSalary || 5000
      const hra = Math.round(basicSalary * 0.2)
      const tax = Math.round(basicSalary * 0.1)
      const gross = basicSalary + hra
      const deductions = tax
      const net = gross - deductions

      return {
        payslip_id: `PS-${Date.now() + index}`,
        payrun_id: newPayrunId,
        period: wizardPeriod,
        employee_id: empId,
        employeeName: empInfo?.name || 'Employee',
        role: empInfo?.role || 'Staff',
        department: empInfo?.department || 'General',
        salary_structure_id: chosenStruct?.salary_structure_id || 'SS-1',
        structureName: chosenStruct?.name || 'Standard Full-Time',
        workedDays: 22,
        totalWorkingDays: 22,
        basic: basicSalary,
        allowances: [
          { name: 'House Rent Allowance (HRA)', amount: hra, category: 'Allowance' }
        ],
        deductionsList: [
          { name: 'Income Tax (TDS)', amount: tax, category: 'Deduction' }
        ],
        gross: gross,
        deductions: deductions,
        net: net,
        status: 'DRAFT',
        warnings: []
      }
    })

    const newPayrun = {
      payrun_id: newPayrunId,
      period: wizardPeriod,
      salary_structure_id: wizardStructureId,
      employeeCount: wizardSelectedEmployees.length,
      gross: 0,
      deductions: 0,
      net: 0,
      status: 'DRAFT',
      warnings: ['Payrun created in DRAFT. Click "Compute Payroll" to calculate earnings, taxes & deductions.'],
      payslipsSent: false
    }

    setPayruns([newPayrun, ...payruns])
    setPayslipsList([...createdSlips, ...payslipsList])
    setIsWizardOpen(false)
    setActivePayrunId(newPayrunId)
  }

  // --- Progression Actions: Compute → Validate → Mark Paid → Send Payslips ---
  const handleCompute = () => {
    if (!activePayrun || activePayrun.status !== 'DRAFT') return

    const payrunSlips = payslipsList.filter(p => p.payrun_id === activePayrun.payrun_id)
    const targetSlips = payrunSlips.length > 0 ? payrunSlips : payslipsList.slice(0, 3)

    const computedGross = targetSlips.reduce((s, p) => s + p.gross, 0)
    const computedDeductions = targetSlips.reduce((s, p) => s + p.deductions, 0)
    const computedNet = targetSlips.reduce((s, p) => s + p.net, 0)

    // Check for realistic warnings
    const warnings = []
    if (targetSlips.some(p => p.workedDays < p.totalWorkingDays)) {
      warnings.push('Warning: 1 or more employees have incomplete working days recorded.')
    }
    if (computedGross > 100000) {
      warnings.push('Notice: High gross payroll volume detected. Ensure sufficient bank account reserves.')
    }

    setPayruns(payruns.map(p => 
      p.payrun_id === activePayrun.payrun_id 
        ? {
            ...p,
            status: 'COMPUTED',
            gross: computedGross,
            deductions: computedDeductions,
            net: computedNet,
            warnings: warnings
          }
        : p
    ))

    setPayslipsList(payslipsList.map(ps => 
      ps.payrun_id === activePayrun.payrun_id 
        ? { ...ps, status: 'COMPUTED' }
        : ps
    ))

    setNotificationMsg('Payroll successfully computed! Please review totals and any warnings before validating.')
    setTimeout(() => setNotificationMsg(''), 6000)
  }

  const handleValidate = () => {
    if (!activePayrun || activePayrun.status !== 'COMPUTED') return

    setPayruns(payruns.map(p => 
      p.payrun_id === activePayrun.payrun_id 
        ? { ...p, status: 'VALIDATED', warnings: [] }
        : p
    ))

    setPayslipsList(payslipsList.map(ps => 
      ps.payrun_id === activePayrun.payrun_id 
        ? { ...ps, status: 'VALIDATED' }
        : ps
    ))

    setNotificationMsg('Payrun validated and locked for disbursement.')
    setTimeout(() => setNotificationMsg(''), 5000)
  }

  const handleMarkPaid = () => {
    if (!activePayrun || activePayrun.status !== 'VALIDATED') return

    setPayruns(payruns.map(p => 
      p.payrun_id === activePayrun.payrun_id 
        ? { ...p, status: 'PAID' }
        : p
    ))

    setPayslipsList(payslipsList.map(ps => 
      ps.payrun_id === activePayrun.payrun_id 
        ? { ...ps, status: 'PAID' }
        : ps
    ))

    setNotificationMsg('Payrun marked as PAID! Direct deposits initiated successfully.')
    setTimeout(() => setNotificationMsg(''), 5000)
  }

  const handleSendPayslips = () => {
    if (!activePayrun || activePayrun.status !== 'PAID') return

    setPayruns(payruns.map(p => 
      p.payrun_id === activePayrun.payrun_id 
        ? { ...p, payslipsSent: true }
        : p
    ))

    setNotificationMsg('Payslips successfully dispatched to all employee email addresses.')
    setTimeout(() => setNotificationMsg(''), 5000)
  }

  // --- Structure Handlers ---
  const handleCreateStructure = (e) => {
    e.preventDefault()
    const newId = `SS-${Date.now()}`
    const newStruct = {
      salary_structure_id: newId,
      name: structForm.name,
      description: structForm.description,
      baseSalary: Number(structForm.baseSalary) || 0
    }
    setStructures([...structures, newStruct])
    setRules({ ...rules, [newId]: [] })
    setIsStructModalOpen(false)
    setStructForm({ name: '', description: '', baseSalary: '' })
  }

  const handleSaveRule = (e) => {
    e.preventDefault()
    if (!activeStructureId) return

    if (editingRuleId) {
      setRules({
        ...rules,
        [activeStructureId]: rules[activeStructureId].map(r => r.rule_id === editingRuleId ? {
          ...r,
          code: ruleForm.code.toUpperCase(),
          name: ruleForm.name,
          category: ruleForm.category,
          amount: ruleForm.amount,
          type: ruleForm.type
        } : r)
      })
    } else {
      const newRule = {
        rule_id: `R-${Date.now()}`,
        code: ruleForm.code.toUpperCase(),
        name: ruleForm.name,
        category: ruleForm.category,
        amount: ruleForm.amount,
        type: ruleForm.type
      }
      setRules({
        ...rules,
        [activeStructureId]: [...(rules[activeStructureId] || []), newRule]
      })
    }
    
    setIsRuleModalOpen(false)
    setEditingRuleId(null)
    setRuleForm({ code: '', name: '', category: 'Allowance', amount: '', type: 'Fixed' })
  }

  const handleEditRule = (rule) => {
    setEditingRuleId(rule.rule_id)
    setRuleForm({
      code: rule.code,
      name: rule.name,
      category: rule.category,
      amount: rule.amount,
      type: rule.type
    })
    setIsRuleModalOpen(true)
  }

  const handleDeleteRule = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      setRules({
        ...rules,
        [activeStructureId]: rules[activeStructureId].filter(r => r.rule_id !== ruleId)
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // --- Views ---

  // 1. Payslip Detailed View
  if (activePayslipId && activePayslip) {
    return (
      <div className="payroll-page payslip-detail-page">
        <div className="payroll-header detail-header no-print">
          <button className="back-button" onClick={() => setActivePayslipId(null)}>
            <ChevronLeft size={20} />
            Back to Payslips
          </button>
          
          <div className="detail-header-content">
            <div>
              <h1>Payslip — {activePayslip.employeeName}</h1>
              <p>Period: {activePayslip.period} | ID: {activePayslip.payslip_id}</p>
            </div>
            <div className="detail-actions">
              <span className={`status status-${activePayslip.status.toLowerCase()}`}>
                {activePayslip.status}
              </span>
              <button className="primary-button" onClick={handlePrint}>
                <Printer size={16} /> Print / Download PDF
              </button>
            </div>
          </div>
        </div>

        {activePayslip.warnings && activePayslip.warnings.length > 0 && (
          <div className="payslip-warning-banner no-print">
            <AlertTriangle size={20} className="warning-icon" />
            <div>
              <strong>Payroll Notice / Warning</strong>
              {activePayslip.warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* Printable Payslip Card */}
        <div className="printable-payslip-card">
          <div className="payslip-company-header">
            <div>
              <div className="payslip-logo">
                <Building2 size={24} />
                <span>PeoplePay360 Inc.</span>
              </div>
              <p className="company-sub">Global Workforce & Payroll Solutions</p>
            </div>
            <div className="payslip-doc-meta">
              <h2>PAYSLIP</h2>
              <p><strong>Period:</strong> {activePayslip.period}</p>
              <p><strong>Payslip Ref:</strong> {activePayslip.payslip_id}</p>
              <p><strong>Payrun Ref:</strong> {activePayslip.payrun_id}</p>
            </div>
          </div>

          <div className="payslip-employee-grid">
            <div className="emp-grid-col">
              <div className="emp-field">
                <span className="field-label">Employee Name:</span>
                <span className="field-value"><strong>{activePayslip.employeeName}</strong></span>
              </div>
              <div className="emp-field">
                <span className="field-label">Employee ID:</span>
                <span className="field-value code-badge">{activePayslip.employee_id}</span>
              </div>
              <div className="emp-field">
                <span className="field-label">Department:</span>
                <span className="field-value">{activePayslip.department}</span>
              </div>
            </div>
            <div className="emp-grid-col">
              <div className="emp-field">
                <span className="field-label">Job Position:</span>
                <span className="field-value">{activePayslip.role}</span>
              </div>
              <div className="emp-field">
                <span className="field-label">Salary Structure:</span>
                <span className="field-value">{activePayslip.structureName} ({activePayslip.salary_structure_id})</span>
              </div>
              <div className="emp-field">
                <span className="field-label">Days Worked:</span>
                <span className="field-value"><strong>{activePayslip.workedDays}</strong> / {activePayslip.totalWorkingDays} days</span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="salary-breakdown-tables">
            <div className="breakdown-col">
              <div className="breakdown-table-header earnings-head">
                <h3>Earnings & Allowances</h3>
                <span>Amount</span>
              </div>
              <div className="breakdown-rows">
                <div className="breakdown-row">
                  <span>Basic Salary</span>
                  <span>{formatCurrency(activePayslip.basic)}</span>
                </div>
                {activePayslip.allowances.map((item, idx) => (
                  <div className="breakdown-row" key={idx}>
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="breakdown-subtotal">
                <strong>Total Gross Earnings</strong>
                <strong>{formatCurrency(activePayslip.gross)}</strong>
              </div>
            </div>

            <div className="breakdown-col">
              <div className="breakdown-table-header deductions-head">
                <h3>Deductions</h3>
                <span>Amount</span>
              </div>
              <div className="breakdown-rows">
                {activePayslip.deductionsList.map((item, idx) => (
                  <div className="breakdown-row" key={idx}>
                    <span>{item.name}</span>
                    <span className="deduction-val">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="breakdown-subtotal">
                <strong>Total Deductions</strong>
                <strong className="deduction-val">-{formatCurrency(activePayslip.deductions)}</strong>
              </div>
            </div>
          </div>

          {/* Net Pay Highlight Card */}
          <div className="payslip-net-summary">
            <div className="net-pay-box">
              <span>NET SALARY PAYABLE</span>
              <h1>{formatCurrency(activePayslip.net)}</h1>
              <p>Credited to Registered Bank Account via Direct Deposit</p>
            </div>
          </div>

          <div className="payslip-footer-signatures">
            <div className="sign-block">
              <div className="sign-line" />
              <span>Authorized Signature</span>
              <p>Finance & Payroll Department</p>
            </div>
            <div className="sign-block">
              <div className="sign-line" />
              <span>Employee Signature</span>
              <p>Acknowledged Receipt</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Payrun Detail View with Step Progression Flow
  if (activePayrunId && activePayrun) {
    const isDraft = activePayrun.status === 'DRAFT'
    const isComputed = activePayrun.status === 'COMPUTED'
    const isValidated = activePayrun.status === 'VALIDATED'
    const isPaid = activePayrun.status === 'PAID'

    const payrunPayslips = payslipsList.filter(p => p.payrun_id === activePayrun.payrun_id)

    return (
      <div className="payroll-page">
        <div className="payroll-header detail-header">
          <button className="back-button" onClick={() => setActivePayrunId(null)}>
            <ChevronLeft size={20} />
            Back to Payruns
          </button>
          
          <div className="detail-header-content">
            <div>
              <div className="title-with-badge">
                <h1>{activePayrun.period}</h1>
                <span className={`status status-${activePayrun.status.toLowerCase()}`}>
                  {activePayrun.status}
                </span>
                {activePayrun.payslipsSent && (
                  <span className="status status-allowance">
                    <Check size={12} style={{ marginRight: '4px' }} />
                    Payslips Sent
                  </span>
                )}
              </div>
              <p>Payrun ID: {activePayrun.payrun_id} | Structure: {activePayrun.salary_structure_id || 'SS-1'}</p>
            </div>

            {/* Actions dynamically gated based on status */}
            <div className="detail-actions">
              {isDraft && (
                <button className="primary-button" onClick={handleCompute}>
                  <Settings size={16} /> Compute Payroll
                </button>
              )}

              {isComputed && (
                <button className="primary-button" onClick={handleValidate}>
                  <CheckCircle size={16} /> Validate Payrun
                </button>
              )}

              {isValidated && (
                <button className="primary-button" onClick={handleMarkPaid}>
                  <CreditCard size={16} /> Mark Paid
                </button>
              )}

              {isPaid && !activePayrun.payslipsSent && (
                <button className="primary-button" onClick={handleSendPayslips}>
                  <Send size={16} /> Send Payslips
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progression Status Bar */}
        <div className="payrun-progression-stepper">
          <div className={`prog-step ${['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'].includes(activePayrun.status) ? 'active' : ''}`}>
            <span className="step-bullet">1</span>
            <span>Draft Created</span>
          </div>
          <div className="prog-line" />
          <div className={`prog-step ${['COMPUTED', 'VALIDATED', 'PAID'].includes(activePayrun.status) ? 'active' : ''}`}>
            <span className="step-bullet">2</span>
            <span>Computed</span>
          </div>
          <div className="prog-line" />
          <div className={`prog-step ${['VALIDATED', 'PAID'].includes(activePayrun.status) ? 'active' : ''}`}>
            <span className="step-bullet">3</span>
            <span>Validated</span>
          </div>
          <div className="prog-line" />
          <div className={`prog-step ${activePayrun.status === 'PAID' ? 'active' : ''}`}>
            <span className="step-bullet">4</span>
            <span>Paid</span>
          </div>
        </div>

        {notificationMsg && (
          <div className="payroll-alert-success">
            <CheckCircle size={18} />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Warnings Display */}
        {activePayrun.warnings && activePayrun.warnings.length > 0 && (
          <div className="payslip-warning-banner">
            <AlertTriangle size={20} className="warning-icon" />
            <div>
              <strong>Payrun Warnings & Advisories</strong>
              {activePayrun.warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* Summary Totals Cards */}
        <div className="payroll-dashboard">
          <div className="stat-card">
            <div className="stat-icon"><Users size={24} /></div>
            <div className="stat-info">
              <p>Employees in Payrun</p>
              <h3>{activePayrun.employeeCount || payrunPayslips.length}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><DollarSign size={24} /></div>
            <div className="stat-info">
              <p>Total Gross</p>
              <h3>{formatCurrency(activePayrun.gross || (isDraft ? 0 : payrunPayslips.reduce((s, p) => s + p.gross, 0)))}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><Settings size={24} /></div>
            <div className="stat-info">
              <p>Total Deductions</p>
              <h3>{formatCurrency(activePayrun.deductions || (isDraft ? 0 : payrunPayslips.reduce((s, p) => s + p.deductions, 0)))}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success"><DollarSign size={24} /></div>
            <div className="stat-info">
              <p>Total Net Disbursement</p>
              <h3>{formatCurrency(activePayrun.net || (isDraft ? 0 : payrunPayslips.reduce((s, p) => s + p.net, 0)))}</h3>
            </div>
          </div>
        </div>

        {/* Payrun Employees & Payslips List */}
        <div className="table-card">
          <div className="table-header-bar">
            <h3>Employee Payslips in this Payrun ({payrunPayslips.length})</h3>
            {isDraft && <span className="helper-hint">Click "Compute Payroll" above to calculate exact values.</span>}
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic Salary</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Payslip Ref</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrunPayslips.map((payslip) => (
                <tr key={payslip.payslip_id}>
                  <td>
                    <div className="employee-cell">
                      <div className="avatar">
                        {payslip.employeeName.split(' ').map(p => p[0]).join('')}
                      </div>
                      <div>
                        <strong>{payslip.employeeName}</strong>
                        <span className="cell-sub">{payslip.role} • {payslip.department}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(payslip.basic)}</td>
                  <td>{isDraft ? '—' : formatCurrency(payslip.gross)}</td>
                  <td className="deduction-val">{isDraft ? '—' : `-${formatCurrency(payslip.deductions)}`}</td>
                  <td><strong>{isDraft ? '—' : formatCurrency(payslip.net)}</strong></td>
                  <td>
                    <span className="code-badge">{payslip.payslip_id}</span>
                  </td>
                  <td>
                    <span className={`status status-${payslip.status.toLowerCase()}`}>
                      {payslip.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary-button sm"
                      onClick={() => {
                        setActivePayrunId(null)
                        setActiveTab('payslips')
                        setActivePayslipId(payslip.payslip_id)
                      }}
                    >
                      <FileText size={14} style={{ marginRight: '4px' }} />
                      View Payslip
                    </button>
                  </td>
                </tr>
              ))}
              {payrunPayslips.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No employees currently assigned to this payrun.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // 3. Structure Detail View
  if (activeStructureId && activeStructure) {
    return (
      <div className="payroll-page">
        <div className="payroll-header detail-header">
          <button className="back-button" onClick={() => setActiveStructureId(null)}>
            <ChevronLeft size={20} />
            Back to Structures
          </button>
          
          <div className="detail-header-content">
            <div>
              <h1>{activeStructure.name}</h1>
              <p>Structure ID: {activeStructure.salary_structure_id} | Base: {formatCurrency(activeStructure.baseSalary)}</p>
            </div>
            <div className="detail-actions">
              <button className="primary-button" onClick={() => {
                setEditingRuleId(null)
                setRuleForm({ code: '', name: '', category: 'Allowance', amount: '', type: 'Fixed' })
                setIsRuleModalOpen(true)
              }}>
                <Plus size={16} /> Add Rule
              </button>
            </div>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Rule Name</th>
                <th>Category</th>
                <th>Amount/Formula</th>
                <th>Type</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRules.map((rule) => (
                <tr key={rule.rule_id}>
                  <td><span className="code-badge">{rule.code}</span></td>
                  <td><strong>{rule.name}</strong></td>
                  <td>
                    <span className={`status status-${rule.category.toLowerCase()}`}>
                      {rule.category}
                    </span>
                  </td>
                  <td>{rule.amount}</td>
                  <td>{rule.type}</td>
                  <td className="actions-col">
                    <div className="action-buttons">
                      <button className="icon-button" title="Edit" onClick={() => handleEditRule(rule)}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button refuse-btn" title="Delete" onClick={() => handleDeleteRule(rule.rule_id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeRules.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">No rules defined for this structure.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isRuleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingRuleId ? 'Edit Salary Rule' : 'Add Salary Rule'}</h2>
              <form onSubmit={handleSaveRule} className="payroll-form">
                <div className="form-group">
                  <label>Rule Code *</label>
                  <input type="text" placeholder="e.g. HRA" required value={ruleForm.code} onChange={(e) => setRuleForm({...ruleForm, code: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Rule Name *</label>
                  <input type="text" placeholder="e.g. House Rent Allowance" required value={ruleForm.name} onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={ruleForm.category} onChange={(e) => setRuleForm({...ruleForm, category: e.target.value})}>
                    <option>Basic</option>
                    <option>Allowance</option>
                    <option>Deduction</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={ruleForm.type} onChange={(e) => setRuleForm({...ruleForm, type: e.target.value})}>
                    <option>Fixed</option>
                    <option>Percentage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount / Value *</label>
                  <input type="text" placeholder="e.g. 500 or 10%" required value={ruleForm.amount} onChange={(e) => setRuleForm({...ruleForm, amount: e.target.value})} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setIsRuleModalOpen(false)}>Cancel</button>
                  <button type="submit" className="primary-button">{editingRuleId ? 'Save Changes' : 'Add Rule'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 4. Main Dashboard View with Role-Gated Tabs: Dashboard | Payruns | Payslips | Salary Structures
  return (
    <div className="payroll-page">
      <div className="payroll-header">
        <div>
          <h1>{isEmployeeOnly ? 'My Payslips & Compensation' : 'Payroll Management'}</h1>
          <p>
            {isEmployeeOnly
              ? 'View personal payroll statements and compensation breakdown'
              : 'Process payroll payruns, review generated payslips, and configure salary compensation structures'}
          </p>
        </div>
        {canManagePayruns && (
          <button className="primary-button" onClick={handleOpenWizard}>
            <Plus size={18} />
            Create Payrun
          </button>
        )}
      </div>

      <div className="payroll-tabs">
        {!isEmployeeOnly && (
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </button>
        )}
        {!isEmployeeOnly && (
          <button className={activeTab === 'payruns' ? 'active' : ''} onClick={() => setActiveTab('payruns')}>
            Payruns
          </button>
        )}
        <button className={activeTab === 'payslips' ? 'active' : ''} onClick={() => setActiveTab('payslips')}>
          Payslips
        </button>
        {canViewStructures && (
          <button className={activeTab === 'structures' ? 'active' : ''} onClick={() => setActiveTab('structures')}>
            Salary Structures
          </button>
        )}
      </div>

      {/* Tab 0: Comprehensive Payroll Dashboard (Stage 5) */}
      {activeTab === 'dashboard' && (
        <div className="tab-content dashboard-tab-content">
          {/* Top KPI Metrics Grid */}
          <div className="payroll-dashboard kpi-grid-4">
            <div className="stat-card">
              <div className="stat-icon success"><DollarSign size={24} /></div>
              <div className="stat-info">
                <p>Total Paid (Disbursed)</p>
                <h3>{formatCurrency(totalPaid)}</h3>
                <span className="kpi-subtext positive">
                  <TrendingUp size={12} /> YTD Settled Payroll
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Activity size={24} /></div>
              <div className="stat-info">
                <p>Total Gross Payroll</p>
                <h3>{formatCurrency(totalGrossPayroll)}</h3>
                <span className="kpi-subtext">
                  Across all active cycles
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon warning"><PieChart size={24} /></div>
              <div className="stat-info">
                <p>Total Deductions (Tax & PF)</p>
                <h3>{formatCurrency(totalDeductionsAll)}</h3>
                <span className="kpi-subtext deduction-sub">
                  Withheld for tax & social security
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><Users size={24} /></div>
              <div className="stat-info">
                <p>Employees Processed</p>
                <h3>{totalEmployeesProcessed}</h3>
                <span className="kpi-subtext">
                  Across all pay periods
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Active Cycle Card + Visual Progress Breakdown */}
          <div className="dashboard-middle-row">
            {/* Latest Payrun Status Card */}
            <div className="dash-card latest-cycle-card">
              <div className="dash-card-header">
                <div>
                  <span className="dash-card-eyebrow">ACTIVE / LATEST PAYRUN</span>
                  <h3>{latestPayrun ? latestPayrun.period : 'No active cycle'}</h3>
                </div>
                {latestPayrun && (
                  <span className={`status status-${latestPayrun.status.toLowerCase()}`}>
                    {latestPayrun.status}
                  </span>
                )}
              </div>

              {latestPayrun ? (
                <div className="cycle-card-body">
                  <div className="cycle-metrics-grid">
                    <div className="cycle-metric">
                      <span className="cm-label">Payrun ID</span>
                      <span className="code-badge">{latestPayrun.payrun_id}</span>
                    </div>
                    <div className="cycle-metric">
                      <span className="cm-label">Structure</span>
                      <span className="cm-val">{latestPayrun.salary_structure_id || 'SS-1'}</span>
                    </div>
                    <div className="cycle-metric">
                      <span className="cm-label">Employees</span>
                      <span className="cm-val font-bold">{latestPayrun.employeeCount}</span>
                    </div>
                    <div className="cycle-metric">
                      <span className="cm-label">Gross Amount</span>
                      <span className="cm-val">{formatCurrency(latestPayrun.gross)}</span>
                    </div>
                    <div className="cycle-metric">
                      <span className="cm-label">Net Payable</span>
                      <span className="cm-val font-bold highlight">{formatCurrency(latestPayrun.net)}</span>
                    </div>
                    <div className="cycle-metric">
                      <span className="cm-label">Payslips Sent</span>
                      <span className="cm-val">{latestPayrun.payslipsSent ? 'Yes (Emailed)' : 'Pending'}</span>
                    </div>
                  </div>

                  {latestPayrun.warnings && latestPayrun.warnings.length > 0 && (
                    <div className="dashboard-advisory-notice">
                      <AlertTriangle size={15} />
                      <span>{latestPayrun.warnings[0]}</span>
                    </div>
                  )}

                  <div className="cycle-card-actions">
                    <button
                      className="primary-button sm"
                      onClick={() => setActivePayrunId(latestPayrun.payrun_id)}
                    >
                      Manage Payrun Flow <ArrowRight size={14} />
                    </button>
                    <button
                      className="secondary-button sm"
                      onClick={handleOpenWizard}
                    >
                      <Plus size={14} /> New Cycle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No payruns found.</div>
              )}
            </div>

            {/* Visual Distribution & Stage Progression Chart */}
            <div className="dash-card visual-breakdown-card">
              <div className="dash-card-header">
                <div>
                  <span className="dash-card-eyebrow">PIPELINE & DISTRIBUTION</span>
                  <h3>Processing Status Distribution</h3>
                </div>
                <Layers size={18} className="text-muted" />
              </div>

              <div className="visual-breakdown-body">
                {/* Visual Segmented Progress Bar */}
                <div className="payroll-visual-progress-bar">
                  <div
                    className="prog-seg seg-paid"
                    style={{ flex: payrunStatusCounts.PAID || 0.1 }}
                    title={`PAID: ${payrunStatusCounts.PAID}`}
                  />
                  <div
                    className="prog-seg seg-validated"
                    style={{ flex: payrunStatusCounts.VALIDATED || 0.1 }}
                    title={`VALIDATED: ${payrunStatusCounts.VALIDATED}`}
                  />
                  <div
                    className="prog-seg seg-computed"
                    style={{ flex: payrunStatusCounts.COMPUTED || 0.1 }}
                    title={`COMPUTED: ${payrunStatusCounts.COMPUTED}`}
                  />
                  <div
                    className="prog-seg seg-draft"
                    style={{ flex: payrunStatusCounts.DRAFT || 0.1 }}
                    title={`DRAFT: ${payrunStatusCounts.DRAFT}`}
                  />
                </div>

                {/* Legend with counts */}
                <div className="status-progress-legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-paid" />
                    <span>PAID</span>
                    <strong>{payrunStatusCounts.PAID}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-validated" />
                    <span>VALIDATED</span>
                    <strong>{payrunStatusCounts.VALIDATED}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-computed" />
                    <span>COMPUTED</span>
                    <strong>{payrunStatusCounts.COMPUTED}</strong>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-draft" />
                    <span>DRAFT</span>
                    <strong>{payrunStatusCounts.DRAFT}</strong>
                  </div>
                </div>

                {/* Net vs Gross visual gauge */}
                <div className="financial-distribution-card">
                  <div className="fd-header">
                    <span>Net Take-Home vs Deductions</span>
                    <strong>
                      {totalGrossPayroll > 0
                        ? `${Math.round((totalNetPayroll / totalGrossPayroll) * 100)}% Net Ratio`
                        : '100%'}
                    </strong>
                  </div>
                  <div className="fd-bar-wrap">
                    <div
                      className="fd-bar-net"
                      style={{
                        width: totalGrossPayroll > 0 ? `${(totalNetPayroll / totalGrossPayroll) * 100}%` : '80%'
                      }}
                    />
                    <div
                      className="fd-bar-ded"
                      style={{
                        width: totalGrossPayroll > 0 ? `${(totalDeductionsAll / totalGrossPayroll) * 100}%` : '20%'
                      }}
                    />
                  </div>
                  <div className="fd-labels">
                    <span className="fd-tag net-tag">Net: {formatCurrency(totalNetPayroll)}</span>
                    <span className="fd-tag ded-tag">Deductions: {formatCurrency(totalDeductionsAll)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Payruns & Recent Payslips */}
          <div className="dashboard-bottom-grid">
            {/* Recent Payruns Table */}
            <div className="table-card">
              <div className="table-header-bar">
                <h3>Recent Payruns</h3>
                <button
                  className="table-link-btn"
                  onClick={() => setActiveTab('payruns')}
                >
                  View All ({payruns.length}) <ArrowRight size={13} />
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Payrun Ref</th>
                    <th>Employees</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayrunsList.map((pr) => (
                    <tr
                      key={pr.payrun_id}
                      className="clickable-row"
                      onClick={() => setActivePayrunId(pr.payrun_id)}
                    >
                      <td><strong>{pr.period}</strong></td>
                      <td><span className="code-badge">{pr.payrun_id}</span></td>
                      <td>{pr.employeeCount}</td>
                      <td><strong>{formatCurrency(pr.net)}</strong></td>
                      <td>
                        <span className={`status status-${pr.status.toLowerCase()}`}>
                          {pr.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secondary-button sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActivePayrunId(pr.payrun_id)
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent Generated Payslips Table */}
            <div className="table-card">
              <div className="table-header-bar">
                <h3>Recent Payslips</h3>
                <button
                  className="table-link-btn"
                  onClick={() => setActiveTab('payslips')}
                >
                  View All ({payslipsList.length}) <ArrowRight size={13} />
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayslipsList.map((ps) => (
                    <tr
                      key={ps.payslip_id}
                      className="clickable-row"
                      onClick={() => setActivePayslipId(ps.payslip_id)}
                    >
                      <td>
                        <div className="employee-cell">
                          <div className="avatar sm">
                            {ps.employeeName.split(' ').map(p => p[0]).join('')}
                          </div>
                          <div>
                            <strong>{ps.employeeName}</strong>
                            <span className="cell-sub">{ps.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>{ps.period}</td>
                      <td><strong>{formatCurrency(ps.net)}</strong></td>
                      <td>
                        <span className={`status status-${ps.status.toLowerCase()}`}>
                          {ps.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secondary-button sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActivePayslipId(ps.payslip_id)
                          }}
                        >
                          <FileText size={13} style={{ marginRight: '3px' }} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Payruns */}
      {activeTab === 'payruns' && (
        <div className="tab-content">
          <div className="payroll-dashboard">
            <div className="stat-card">
              <div className="stat-icon success"><DollarSign size={24} /></div>
              <div className="stat-info">
                <p>Total Paid (YTD)</p>
                <h3>{formatCurrency(totalPaid)}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CalendarCheck size={24} /></div>
              <div className="stat-info">
                <p>Next Processing</p>
                <h3>{nextDraft ? nextDraft.period : 'None Pending'}</h3>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Play size={24} /></div>
              <div className="stat-info">
                <p>Payruns Processed</p>
                <h3>{payruns.filter(p => p.status === 'PAID').length}</h3>
              </div>
            </div>
          </div>

          <div className="payroll-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search payruns by period or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Payrun ID</th>
                  <th>Structure</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayruns.map((pr) => (
                  <tr key={pr.payrun_id} className="clickable-row" onClick={() => setActivePayrunId(pr.payrun_id)}>
                    <td><strong>{pr.period}</strong></td>
                    <td><span className="code-badge">{pr.payrun_id}</span></td>
                    <td>{pr.salary_structure_id || 'SS-1'}</td>
                    <td>{pr.employeeCount}</td>
                    <td>{formatCurrency(pr.gross)}</td>
                    <td><strong>{formatCurrency(pr.net)}</strong></td>
                    <td>
                      <span className={`status status-${pr.status.toLowerCase()}`}>
                        {pr.status}
                      </span>
                    </td>
                    <td>
                      <button className="secondary-button sm" onClick={(e) => {
                        e.stopPropagation()
                        setActivePayrunId(pr.payrun_id)
                      }}>
                        View Payrun
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPayruns.length === 0 && (
              <div className="empty-state">No payruns found.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Payslips */}
      {activeTab === 'payslips' && (
        <div className="tab-content">
          <div className="payroll-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by employee, payslip ID, payrun, or period..."
                value={payslipSearch}
                onChange={(e) => setPayslipSearch(e.target.value)}
              />
            </div>

            <select
              className="status-select"
              value={payslipStatusFilter}
              onChange={(e) => setPayslipStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="COMPUTED">Computed</option>
              <option value="VALIDATED">Validated</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Payslip Ref</th>
                  <th>Payroll Period</th>
                  <th>Worked Days</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map((ps) => (
                  <tr key={ps.payslip_id} className="clickable-row" onClick={() => setActivePayslipId(ps.payslip_id)}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {ps.employeeName.split(' ').map(p => p[0]).join('')}
                        </div>
                        <div>
                          <strong>{ps.employeeName}</strong>
                          <span className="cell-sub">{ps.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="code-badge">{ps.payslip_id}</span>
                    </td>
                    <td>
                      <span className="period-cell">
                        <Calendar size={14} />
                        {ps.period}
                      </span>
                    </td>
                    <td>{ps.workedDays} / {ps.totalWorkingDays} days</td>
                    <td>{formatCurrency(ps.gross)}</td>
                    <td className="deduction-val">-{formatCurrency(ps.deductions)}</td>
                    <td><strong>{formatCurrency(ps.net)}</strong></td>
                    <td>
                      <span className={`status status-${ps.status.toLowerCase()}`}>
                        {ps.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary-button sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActivePayslipId(ps.payslip_id)
                        }}
                      >
                        <FileText size={14} style={{ marginRight: '4px' }} />
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayslips.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-state">No payslips found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Salary Structures */}
      {activeTab === 'structures' && (
        <div className="tab-content">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Structure Name</th>
                  <th>Structure ID</th>
                  <th>Description</th>
                  <th>Base Salary</th>
                  <th>Rules Count</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <tr key={s.salary_structure_id} className="clickable-row" onClick={() => setActiveStructureId(s.salary_structure_id)}>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="code-badge">{s.salary_structure_id}</span></td>
                    <td>{s.description}</td>
                    <td>{formatCurrency(s.baseSalary)}</td>
                    <td>{(rules[s.salary_structure_id] || []).length} Rules</td>
                    <td>
                      <button className="secondary-button sm" onClick={(e) => {
                        e.stopPropagation()
                        setActiveStructureId(s.salary_structure_id)
                      }}>
                        Edit Rules
                      </button>
                    </td>
                  </tr>
                ))}
                {structures.length === 0 && (
                  <tr><td colSpan="6" className="empty-state">No salary structures found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payrun Creation Wizard (Stage 4) */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content wizard-modal">
            <div className="wizard-modal-header">
              <h2>Create Payrun Wizard</h2>
              <div className="wizard-step-indicator">
                <span className={`step-badge ${wizardStep === 1 ? 'active' : 'completed'}`}>Step 1: Period & Structure</span>
                <ArrowRight size={14} />
                <span className={`step-badge ${wizardStep === 2 ? 'active' : ''}`}>Step 2: Select Employees</span>
              </div>
            </div>

            {wizardError && (
              <div className="wizard-error-banner">
                <AlertTriangle size={16} />
                <span>{wizardError}</span>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="payroll-form">
                <div className="form-group">
                  <label>Payroll Period Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. January 2024"
                    value={wizardPeriod}
                    onChange={(e) => setWizardPeriod(e.target.value)}
                  />
                  <small className="field-hint">Specify the month and year of the pay cycle.</small>
                </div>

                <div className="form-group">
                  <label>Salary Structure *</label>
                  <select
                    value={wizardStructureId}
                    onChange={(e) => setWizardStructureId(e.target.value)}
                  >
                    {structures.map(s => (
                      <option key={s.salary_structure_id} value={s.salary_structure_id}>
                        {s.name} ({s.salary_structure_id}) — Base: {formatCurrency(s.baseSalary)}
                      </option>
                    ))}
                  </select>
                  <small className="field-hint">Components and tax calculation rules will follow this structure.</small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setIsWizardOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="primary-button" onClick={handleWizardNext}>
                    Next: Select Employees <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <div className="wizard-selection-toolbar">
                  <span>
                    Selected: <strong>{wizardSelectedEmployees.length}</strong> of {availableEmployees.length} employees
                  </span>
                  <button type="button" className="secondary-button sm" onClick={handleToggleSelectAll}>
                    {wizardSelectedEmployees.length === availableEmployees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="employee-selection-list">
                  {availableEmployees.map((emp) => {
                    const isChecked = wizardSelectedEmployees.includes(emp.employee_id)
                    return (
                      <label
                        key={emp.employee_id}
                        className={`employee-select-item ${isChecked ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEmployee(emp.employee_id)}
                        />
                        <div className="emp-select-info">
                          <div className="avatar sm">
                            {emp.name.split(' ').map(p => p[0]).join('')}
                          </div>
                          <div>
                            <strong>{emp.name}</strong>
                            <p>{emp.role} • {emp.department}</p>
                          </div>
                        </div>
                        <span className="emp-base-pay">{formatCurrency(emp.basic)}</span>
                      </label>
                    )
                  })}
                </div>

                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleFinishCreatePayrun}
                    disabled={wizardSelectedEmployees.length === 0}
                  >
                    <Check size={16} />
                    Create Payrun ({wizardSelectedEmployees.length} Employees)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salary Structure Creation Modal */}
      {isStructModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Salary Structure</h2>
            <form onSubmit={handleCreateStructure} className="payroll-form">
              <div className="form-group">
                <label>Structure Name *</label>
                <input type="text" required placeholder="e.g. Executive Package" value={structForm.name} onChange={(e) => setStructForm({...structForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={structForm.description} onChange={(e) => setStructForm({...structForm, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Base Salary Amount *</label>
                <input type="number" required placeholder="5000" value={structForm.baseSalary} onChange={(e) => setStructForm({...structForm, baseSalary: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsStructModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Create Structure</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll