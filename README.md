# PeoplePay360

> A modern HR & Payroll Management Platform for managing employees, contracts, attendance, time off, salary structures, payroll processing, and payslips.

## 📌 Overview

PeoplePay360 is an HR and Payroll Management System designed to provide a centralized platform for managing the employee lifecycle and payroll operations.

The platform connects core HR operations with payroll processing, allowing HR teams to manage employee information, contracts, working schedules, attendance, time-off requests, salary structures, payruns, and payslips from a single application.

The project was developed as part of the **HRMS OXP 24-Hour Challenge**.

---

## 🎯 Key Objectives

- Centralize HR and payroll operations
- Simplify employee and contract management
- Track attendance and working schedules
- Manage time-off allocations and requests
- Configure salary structures and salary rules
- Process payroll through controlled payrun stages
- Generate and review employee payslips
- Provide a clean and responsive HR portal
- Support role-based access for different HR users

---

## ✨ Features

### 👥 Employee Management

- Employee directory
- Search employees
- Department filtering
- Employee status
- Employee profile information
- List and card/grid views

### 📄 Contract Management

- Employee contracts
- Job position and department
- Wage information
- Contract start and end dates
- Active/expired contract status
- Contract search and filtering

### 🕐 Working Schedules

- Working schedule management
- Working days
- Start/end times
- Break duration
- Employee assignment information
- Active/inactive schedules

### 📊 Attendance

- Attendance records
- Employee attendance tracking
- Attendance statuses
- Search and filtering
- Attendance-related workflow UI

### 🌴 Time Off

- Time-off requests
- Time-off types
- Allocations and balances
- Request approval/refusal
- Request status tracking
- Search and filtering

### 💰 Payroll

#### Payruns

- Payrun listing
- Payroll period
- Salary structure selection
- Employee selection
- Payroll status tracking
- Payroll totals

#### Payrun Processing

The payroll workflow follows:

```text
DRAFT
   ↓
COMPUTED
   ↓
VALIDATED
   ↓
PAID

The frontend currently provides a functional workflow for:

Create Payrun
      ↓
Select Period & Salary Structure
      ↓
Select Employees
      ↓
Create Payrun
      ↓
Compute Payroll
      ↓
Review Results & Warnings
      ↓
Validate Payrun
      ↓
Mark Paid
      ↓
View Payslips
Salary Structures
Salary structure listing
Base salary
Salary structure descriptions
Salary rules
Add/edit/delete salary rules
Create salary structures
Payslips
Payslip listing
Employee information
Payroll period
Worked days
Earnings and allowances
Salary deductions
Gross salary
Net salary
Salary breakdown
Payroll warnings
Payslip detail view
Print-ready payslip interface
🛠️ Tech Stack
Frontend
React
Vite
React Router
Axios
Lucide React
CSS
Backend
FastAPI
SQLAlchemy
PostgreSQL
Supabase
Deployment
Frontend: Vercel
Backend: Render
Database: Supabase PostgreSQL
🏗️ Architecture
                    PeoplePay360
                         │
                         ▼
              ┌─────────────────────┐
              │   React + Vite      │
              │     Frontend        │
              └──────────┬──────────┘
                         │
                         │ REST API
                         ▼
              ┌─────────────────────┐
              │      FastAPI        │
              │      Backend        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    SQLAlchemy       │
              │        ORM          │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Supabase PostgreSQL │
              └─────────────────────┘

The frontend is designed around a centralized API layer so that UI components remain separated from backend communication.

👤 User Roles

PeoplePay360 is designed around five primary roles:

Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin

Different roles are intended to receive different levels of access to HR and payroll functionality.

Authorization is ultimately enforced by the backend, while the frontend provides role-aware navigation and user experience.

📁 Project Structure
peoplepay360/
│
├── public/
│
├── src/
│   ├── api/
│   │   ├── client.js
│   │   ├── employees.js
│   │   ├── contracts.js
│   │   ├── attendance.js
│   │   ├── timeOff.js
│   │   └── payroll.js
│   │
│   ├── components/
│   │
│   ├── layouts/
│   │   └── AppShell.jsx
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Users/
│   │   ├── Employees/
│   │   ├── Contracts/
│   │   ├── Schedules/
│   │   ├── Attendance/
│   │   ├── TimeOff/
│   │   └── payroll/
│   │
│   ├── router.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── README.md
🚀 Getting Started
Prerequisites

Make sure you have installed:

Node.js
npm
Git
Clone the repository
git clone https://github.com/ChitBrahmbhatt/peoplepay360.git
cd peoplepay360
Install dependencies
npm install
Start development server
npm run dev

The application will be available at:

http://localhost:5173
Run lint
npm run lint
Build for production
npm run build
🎨 UI & UX

PeoplePay360 includes:

Light and dark themes
Responsive HR portal layout
Consistent navigation
Search and filtering
Status badges
Interactive tables
Modal forms
Multi-step payroll workflow
Loading/error/empty-state support
Clear payroll status progression
🔌 API Design

The backend API follows a versioned structure:

/api/v1

The frontend is designed to communicate with the backend through dedicated API modules rather than placing API calls directly inside every UI component.

Core API areas include:

Employees
Contracts
Attendance
Time Off
Payroll
Payslips
Salary Structures

Primary resource identifiers include:

employee_id
department_id
manager_id
schedule_id
contract_id
salary_structure_id
payrun_id
payslip_id
time_off_type_id
🔄 Payroll Processing Example

A typical payroll flow is:

Employee
   │
   ▼
Contract
   │
   ▼
Attendance / Time Off
   │
   ▼
Salary Structure
   │
   ▼
Create Payrun
   │
   ▼
Compute Payroll
   │
   ▼
Review Salary Results
   │
   ▼
Validate
   │
   ▼
Mark Paid
   │
   ▼
Employee Payslip

This connects HR data with payroll processing instead of treating payroll as an isolated module.

🧪 Current Development Status
Frontend
 React + Vite foundation
 Application routing
 HR portal layout
 Light/Dark theme
 Employee management UI
 Contract management UI
 Working schedule UI
 Attendance UI
 Time-off UI
 Payroll payruns
 Salary structures
 Salary rules
 Payslips
 Payrun creation wizard
 Payroll computation workflow
 Payrun validation workflow
 Payrun paid workflow
Backend Integration
 Connect frontend to FastAPI
 Replace remaining mock data
 Implement authentication
 Implement backend authorization
 Connect Supabase PostgreSQL data
 End-to-end integration testing
Finalization
 Role-based navigation and permissions
 Production API integration
 Full end-to-end testing
 Final deployment verification
 Demo preparation
👨‍💻 Team
PeoplePay360 Team
Member	Responsibility
Rishika	Backend / HR functionality
Chit	Backend / Payroll functionality
Ansh	Frontend / UI / API integration

The frontend focuses on providing a consistent user experience across HR and payroll workflows while remaining aligned with the team's API contract.

🔐 Security Approach

The frontend is responsible for the user interface and role-aware experience.

Security-sensitive authorization must be enforced by the backend.

For example, hiding the Payroll navigation item from an Employee is not sufficient security. The backend must verify the authenticated user's role before allowing access to payroll resources.

📈 Future Improvements
Complete FastAPI integration
Secure authentication and authorization
Server-side pagination and filtering
Advanced payroll calculations
Automated payslip PDF generation
Audit logs
Notifications
Improved dashboard analytics
Production monitoring
Automated testing
📜 License

This project was developed for the HRMS OXP 24-Hour Challenge.


### One important correction before you paste it

Your repo is currently the **team repo**:

`ChitBrahmbhatt/peoplepay360`

So I used that in the clone command rather than your personal fork.

Also, I deliberately wrote **“Backend Integration — not complete”** instead of pretending everything is already connected. That's much safer if an evaluator checks the repository.

After replacing the README, commit it with:

```powershell
git add README.md
git commit -m "Add PeoplePay360 project README"
git push origin person3/frontend

This will make the repo look far more like an actual project submission rather than the default Vite template.

entire readme in copy able format
# PeoplePay360

> A modern HR & Payroll Management Platform for managing employees, contracts, attendance, time off, salary structures, payroll processing, and payslips.

## 📌 Overview

PeoplePay360 is an HR and Payroll Management System designed to provide a centralized platform for managing the employee lifecycle and payroll operations.

The platform connects core HR operations with payroll processing, allowing HR teams to manage employee information, contracts, working schedules, attendance, time-off requests, salary structures, payruns, and payslips from a single application.

The project was developed as part of the **HRMS OXP 24-Hour Challenge**.

---

## 🎯 Key Objectives

- Centralize HR and payroll operations
- Simplify employee and contract management
- Track attendance and working schedules
- Manage time-off allocations and requests
- Configure salary structures and salary rules
- Process payroll through controlled payrun stages
- Generate and review employee payslips
- Provide a clean and responsive HR portal
- Support role-based access for different HR users

---

## ✨ Features

### 👥 Employee Management

- Employee directory
- Search employees
- Department filtering
- Employee status
- Employee profile information
- List and card/grid views

### 📄 Contract Management

- Employee contracts
- Job position and department
- Wage information
- Contract start and end dates
- Active/expired contract status
- Contract search and filtering

### 🕐 Working Schedules

- Working schedule management
- Working days
- Start/end times
- Break duration
- Employee assignment information
- Active/inactive schedules

### 📊 Attendance

- Attendance records
- Employee attendance tracking
- Attendance statuses
- Search and filtering
- Attendance-related workflow UI

### 🌴 Time Off

- Time-off requests
- Time-off types
- Allocations and balances
- Request approval/refusal
- Request status tracking
- Search and filtering

### 💰 Payroll

#### Payruns

- Payrun listing
- Payroll period
- Salary structure selection
- Employee selection
- Payroll status tracking
- Payroll totals

#### Payrun Processing

The payroll workflow follows:

```text
DRAFT
   ↓
COMPUTED
   ↓
VALIDATED
   ↓
PAID

The frontend currently provides a functional workflow for:

Create Payrun
      ↓
Select Period & Salary Structure
      ↓
Select Employees
      ↓
Create Payrun
      ↓
Compute Payroll
      ↓
Review Results & Warnings
      ↓
Validate Payrun
      ↓
Mark Paid
      ↓
View Payslips
Salary Structures
Salary structure listing
Base salary
Salary structure descriptions
Salary rules
Add/edit/delete salary rules
Create salary structures
Payslips
Payslip listing
Employee information
Payroll period
Worked days
Earnings and allowances
Salary deductions
Gross salary
Net salary
Salary breakdown
Payroll warnings
Payslip detail view
Print-ready payslip interface
🛠️ Tech Stack
Frontend
React
Vite
React Router
Axios
Lucide React
CSS
Backend
FastAPI
SQLAlchemy
PostgreSQL
Supabase
Deployment
Frontend: Vercel
Backend: Render
Database: Supabase PostgreSQL
🏗️ Architecture
                    PeoplePay360
                         │
                         ▼
              ┌─────────────────────┐
              │   React + Vite      │
              │     Frontend        │
              └──────────┬──────────┘
                         │
                         │ REST API
                         ▼
              ┌─────────────────────┐
              │      FastAPI        │
              │      Backend        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    SQLAlchemy       │
              │        ORM          │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Supabase PostgreSQL │
              └─────────────────────┘

The frontend is designed around a centralized API layer so that UI components remain separated from backend communication.

👤 User Roles

PeoplePay360 is designed around five primary roles:

Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin

Different roles are intended to receive different levels of access to HR and payroll functionality.

Authorization is ultimately enforced by the backend, while the frontend provides role-aware navigation and user experience.

📁 Project Structure
peoplepay360/
│
├── public/
│
├── src/
│   ├── api/
│   │   ├── client.js
│   │   ├── employees.js
│   │   ├── contracts.js
│   │   ├── attendance.js
│   │   ├── timeOff.js
│   │   └── payroll.js
│   │
│   ├── components/
│   │
│   ├── layouts/
│   │   └── AppShell.jsx
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Users/
│   │   ├── Employees/
│   │   ├── Contracts/
│   │   ├── Schedules/
│   │   ├── Attendance/
│   │   ├── TimeOff/
│   │   └── payroll/
│   │
│   ├── router.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── README.md
🚀 Getting Started
Prerequisites

Make sure you have installed:

Node.js
npm
Git
Clone the Repository
git clone https://github.com/ChitBrahmbhatt/peoplepay360.git
cd peoplepay360
Install Dependencies
npm install
Start Development Server
npm run dev

The application will be available at:

http://localhost:5173
Run Lint
npm run lint
Build for Production
npm run build
🎨 UI & UX

PeoplePay360 includes:

Light and dark themes
Responsive HR portal layout
Consistent navigation
Search and filtering
Status badges
Interactive tables
Modal forms
Multi-step payroll workflow
Loading/error/empty-state support
Clear payroll status progression
🔌 API Design

The backend API follows a versioned structure:

/api/v1

The frontend is designed to communicate with the backend through dedicated API modules rather than placing API calls directly inside every UI component.

Core API areas include:

Employees
Contracts
Attendance
Time Off
Payroll
Payslips
Salary Structures

Primary resource identifiers include:

employee_id
department_id
manager_id
schedule_id
contract_id
salary_structure_id
payrun_id
payslip_id
time_off_type_id
🔄 Payroll Processing Example

A typical payroll flow is:

Employee
   │
   ▼
Contract
   │
   ▼
Attendance / Time Off
   │
   ▼
Salary Structure
   │
   ▼
Create Payrun
   │
   ▼
Compute Payroll
   │
   ▼
Review Salary Results
   │
   ▼
Validate
   │
   ▼
Mark Paid
   │
   ▼
Employee Payslip

This connects HR data with payroll processing instead of treating payroll as an isolated module.

🧪 Current Development Status
Frontend
 React + Vite foundation
 Application routing
 HR portal layout
 Light/Dark theme
 Employee management UI
 Contract management UI
 Working schedule UI
 Attendance UI
 Time-off UI
 Payroll payruns
 Salary structures
 Salary rules
 Payslips
 Payrun creation wizard
 Payroll computation workflow
 Payrun validation workflow
 Payrun paid workflow
Backend Integration
 Connect frontend to FastAPI
 Replace remaining mock data
 Implement authentication
 Implement backend authorization
 Connect Supabase PostgreSQL data
 End-to-end integration testing
Finalization
 Role-based navigation and permissions
 Production API integration
 Full end-to-end testing
 Final deployment verification
 Demo preparation
👨‍💻 Team
PeoplePay360 Team
Member	Responsibility
Rishika	Backend / HR functionality
Chit	Backend / Payroll functionality
Ansh	Frontend / UI / API integration

The frontend focuses on providing a consistent user experience across HR and payroll workflows while remaining aligned with the team's API contract.

🔐 Security Approach

The frontend is responsible for the user interface and role-aware experience.

Security-sensitive authorization must be enforced by the backend.

For example, hiding the Payroll navigation item from an Employee is not sufficient security. The backend must verify the authenticated user's role before allowing access to payroll resources.

📈 Future Improvements
Complete FastAPI integration
Secure authentication and authorization
Server-side pagination and filtering
Advanced payroll calculations
Automated payslip PDF generation
Audit logs
Notifications
Improved dashboard analytics
Production monitoring
Automated testing
