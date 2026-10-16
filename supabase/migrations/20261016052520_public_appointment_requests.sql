-- Permit unauthenticated users to submit appointment requests only.
-- Admin-only SELECT/UPDATE/DELETE policies remain the only way to read/manage rows.
alter table public.appointments add column if not exists guest_name text;
alter table public.appointments add column if not exists guest_phone text;
grant insert (guest_name, guest_phone, doctor, appointment_date, appointment_time, dept)
  on table public.appointments to anon;
drop policy if exists public_submit_appointment_request on public.appointments;
create policy public_submit_appointment_request on public.appointments
  for insert to anon with check (
    patient_id is null
    and status = 'Scheduled'
    and guest_name is not null and length(btrim(guest_name)) between 2 and 120
    and guest_phone is not null and guest_phone ~ '^[+0-9() .-]{7,32}$'
    and doctor is not null and length(btrim(doctor)) between 2 and 120
    and appointment_date is not null
    and appointment_date between current_date and current_date + 365
    and appointment_time is not null
    and dept is not null and length(btrim(dept)) between 2 and 100
  );
