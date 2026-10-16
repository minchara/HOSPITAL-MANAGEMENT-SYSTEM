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

Patients, appointments, and bills are stored in the connected Supabase project. Admin sign-in is required for patient records, billing, and viewing/managing appointment requests. Anyone can use `book-appointment.html` to submit an appointment request without signing in; the public API can only insert validated appointment requests and cannot read them. Admins can see guest name and phone in the appointments view.

### Create the first administrator

1. In Supabase Dashboard, open **Authentication → Users** and create the administrator account. Public sign-up is intentionally disabled.
2. In Supabase Dashboard → **SQL Editor**, grant the admin role to that account by running this query with the account's email:
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'YOUR_ADMIN_EMAIL';
   ```
   Verify that one row was updated, then sign in again so Supabase issues a token with the new trusted app metadata. Never put authorization roles in user-editable metadata.
3. Open `login.html` on the deployed site and sign in with that account.

The browser uses the project's publishable key, which is safe to expose because every data table has RLS enabled. Never put a Supabase secret or service-role key in this repository. Anonymous table access remains denied.

This is a public demo. Do not enter real patient or payment data; it has no clinical compliance controls or staff-level permissions.
