patients, appointments, bills = [], [], []
pid_counter, aid, bid = 1, 1, 1

def add_patient():
    global pid_counter
    p = {"id": pid_counter, "name": input("Name: "), "age": input("Age: "),
         "gender": input("Gender: "), "phone": input("Phone: "),
         "disease": input("Disease: ")}
    patients.append(p); print(f"Added Patient {pid_counter}"); pid_counter += 1

def view_patients():
    if not patients: return print("No patients.")
    print(f"{'ID':<5}{'Name':<15}{'Age':<5}{'Gender':<10}{'Phone':<12}{'Disease':<15}")
    for p in patients: print(f"{p['id']:<5}{p['name']:<15}{p['age']:<5}{p['gender']:<10}{p['phone']:<12}{p['disease']:<15}")

def book_appt():
    global aid
    pid = int(input("Patient ID: "))
    if not any(p['id'] == pid for p in patients): return print("Patient not found.")
    a = {"id": aid, "pid": pid, "doctor": input("Doctor: "),
         "date": input("Date: "), "time": input("Time: "), "dept": input("Dept: "), "status": "Scheduled"}
    appointments.append(a); print(f"Booked Appt {aid}"); aid += 1

def view_appts():
    if not appointments: return print("No appointments.")
    print(f"{'ID':<5}{'PID':<5}{'Doctor':<15}{'Date':<12}{'Time':<8}{'Dept':<12}{'Status':<10}")
    for a in appointments: print(f"{a['id']:<5}{a['pid']:<5}{a['doctor']:<15}{a['date']:<12}{a['time']:<8}{a['dept']:<12}{a['status']:<10}")

def manage_billing():
    global bid
    pid = int(input("Patient ID for Bill: "))
    if not any(p['id'] == pid for p in patients): return print("Patient not found.")
    amt = input("Amount: ")
    b = {"id": bid, "pid": pid, "amt": amt, "status": "Paid"}
    bills.append(b); print(f"Bill {bid} generated for ${amt}"); bid += 1

def view_bills():
    if not bills: return print("No bills.")
    print(f"{'Bill ID':<10}{'PID':<5}{'Amount':<10}{'Status':<10}")
    for b in bills: print(f"{b['id']:<10}{b['pid']:<5}{b['amt']:<10}{b['status']:<10}")

while True:
    print("\n1.Add Patient  2.View Patients  3.Book Appt  4.View Appts  5.Billing  6.View Bills  7.Exit")
    ch = input("Choice: ")
    if ch == '1': add_patient()
    elif ch == '2': view_patients()
    elif ch == '3': book_appt()
    elif ch == '4': view_appts()
    elif ch == '5': manage_billing()
    elif ch == '6': view_bills()
    elif ch == '7': break