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

## ⚠️ Important Notes

* **In-Memory Storage**: Data resets every time the script is closed.
  
* **Data Input**: Entering text inside numeric Patient ID fields will crash the program.
