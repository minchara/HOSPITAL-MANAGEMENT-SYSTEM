patients, appointments, bills = [], [], []
pid, aid, bid = 1, 1, 1

def add_patient():
    global pid
    p = {"id": pid, "name": input("Name: "), "age": input("Age: "),
         "gender": input("Gender: "), "phone": input("Phone: "),
         "disease": input("Disease: ")}
    patients.append(p); print(f"Added Patient {pid}"); pid += 1

def view_patients():
    if not patients: return print("No patients.")
    print(f"{'ID':<5}{'Name':<15}{'Age':<5}{'Gender':<10}{'Phone':<12}{'Disease':<15}")
    for p in patients: print(f"{p['id']:<5}{p['name']:<15}{p['age']:<5}{p['gender']:<10}{p['phone']:<12}{p['disease']:<15}")

def book_appt():
    global aid
    pid = int(input("Patient ID: "))
    if not any(p['id']==pid for p in patients): return print("Patient not found.")
    a = {"id": aid, "pid": pid, "doctor": input("Doctor: "),
         "date": input("Date: "), "time": input("Time: "),
         "dept": input("Dept: "), "status":"Scheduled"}
    appointments.append(a); print(f"Booked Appt {aid}"); aid += 1

def view_appts():
    if not appointments: return print("No appointments.")
    print(f"{'ID':<5}{'PID':<5}{'Doctor':<15}{'Date':<12}{'Time':<10}{'Dept':<12}{'Status':<10}")
    for a in appointments: print(f"{a['id']:<5}{a['pid']:<5}{a['doctor']:<15}{a['date']:<12}{a['time']:<10}{a['dept']:<12}{a['status']:<10}")

def gen_bill():
    global bid
    pid = int(input("Patient ID: "))
    pat = next((p for p in patients if p['id']==pid), None)
    if not pat: return print("Patient not found.")
    c,m,l,r,o = [float(input(f"{x}: ")) for x in ["Consult","Medicine","Lab","Room","Other"]]
    total, tax, grand = c+m+l+r+o, (c+m+l+r+o)*0.05, (c+m+l+r+o)*1.05
    b = {"id": bid, "pid": pid, "name": pat['name'], "grand": grand}
    bills.append(b); print(f"Bill {bid} Total Rs.{grand:.2f}"); bid += 1

def view_bills():
    if not bills: return print("No bills.")
    print(f"{'ID':<5}{'PID':<5}{'Name':<15}{'Grand':<10}")
    for b in bills: print(f"{b['id']:<5}{b['pid']:<5}{b['name']:<15}Rs.{b['grand']:.2f}")

def menu():
    while True:
        print("\n1.Patient 2.Appointment 3.Billing 4.Exit")
        c = input("Choice: ")
        if c=="1": add_patient(); view_patients()
        elif c=="2": book_appt(); view_appts()
        elif c=="3": gen_bill(); view_bills()
        elif c=="4": break
        else: print("Invalid!")

menu()
