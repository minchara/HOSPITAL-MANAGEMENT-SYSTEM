# HOSPITAL-MANAGEMENT-SYSTEM

A Hospital Management System (HMS) is a centralized digital software platform that connects healthcare operations, clinical records, and financial systems into a unified workflow. By digitising the core pillars of a medical facility—patient records, appointment scheduling, and billing management—the system eliminates manual errors, speeds up care delivery, and stops revenue leakage.

A lightweight, console-based terminal application built in Python and HTML to streamline basic healthcare administration workflows. 

## ⚙️ Features

* **Patient Registry**: Add patient profiles and view formatted records.
  
* **Appointment Scheduling**: Book appointments tied directly to unique Patient IDs.
  
* **Billing System**: Generate instant financial receipts for registered patients.
  
* **ID Validation**: Prevents booking or billing for non-existent patient records.
  

## 🚀 Getting Started

### Prerequisites

* Python 3.x installed on your machine.

### Installation & Execution
1. Clone or download the repository file:
   ```bash
   git clone https://github.com
   cd hospital-management
   ```
2. Run the application directly from your terminal:
   ```bash
   python main.py
   ```

## 📊 System Overview

The application utilizes an interactive numeric menu:
* **1-2 (Patients)**: Register new profiles or print out the patient directory.
  
* **3-4 (Appointments)**: Log doctor visits and view the current calendar grid.
  
* **5-6 (Billing)**: Input invoice costs and monitor paid receipt sheets.
  
* **7 (Exit)**: Safely close out the current operational system loop.

## Supabase

The database schema is defined in `supabase/migrations/20261016043526_hospital_management_initial_schema.sql` and has been applied to the connected Supabase project. It creates `patients`, `appointments`, and `bills`.

The root `.mcp.json` configures the hosted Supabase MCP server for this project, limited to the database and documentation tools. Sign in to Supabase through your MCP client's OAuth flow; do not put access tokens or database keys in this repository.

### Access and application status

Row Level Security is enabled on all three tables. The `anon` and `authenticated` roles have no table privileges or policies, so API access is denied until an authenticated staff access model and corresponding policies are designed. The Python console program currently stores records in memory and is not yet wired to Supabase. Never add a Supabase service-role or secret key to the repository or a client application.
