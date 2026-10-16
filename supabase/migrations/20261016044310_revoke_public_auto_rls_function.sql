-- Keep this SECURITY DEFINER event-trigger helper out of the Data API.
-- The event trigger continues to invoke it for DDL events.
revoke all privileges on function public.rls_auto_enable()
  from public, anon, authenticated;
