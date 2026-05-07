-- Founding counter increment (called from webhook, runs as service role)
create or replace function public.increment_founding_counter()
returns void language plpgsql security definer as $$
begin
  update public.founding_counter
  set count = count + 1
  where id = 1 and count < cap;
end;
$$;
