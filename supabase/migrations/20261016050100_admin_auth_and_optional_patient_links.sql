-- Allow appointment and bill records without a patient, and authorize only
-- signed-in Supabase users marked admin in trusted app_metadata.
alter table public.appointments alter column patient_id drop not null;
alter table public.bills alter column patient_id drop not null;
alter table public.appointments drop constraint if exists appointments_patient_id_fkey;
alter table public.appointments add constraint appointments_patient_id_fkey foreign key(patient_id) references public.patients(id) on delete set null;
alter table public.bills drop constraint if exists bills_patient_id_fkey;
alter table public.bills add constraint bills_patient_id_fkey foreign key(patient_id) references public.patients(id) on delete set null;
alter table public.bills drop constraint if exists bills_status_check;
update public.bills set status=case when status='Paid' then 'Paid' else 'Due' end;
alter table public.bills add constraint bills_status_check check(status in ('Paid','Due'));
revoke all privileges on table public.patients,public.appointments,public.bills from anon,authenticated;
grant select,insert,update,delete on table public.patients,public.appointments,public.bills to authenticated;
drop policy if exists hospital_admin_all_patients on public.patients;
create policy hospital_admin_all_patients on public.patients for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists hospital_admin_all_appointments on public.appointments;
create policy hospital_admin_all_appointments on public.appointments for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists hospital_admin_all_bills on public.bills;
create policy hospital_admin_all_bills on public.bills for all to authenticated using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
