-- VEYRO: projekt wspólnej bazy. Uruchomić dopiero w wybranym projekcie Supabase.
-- Ta migracja NIE przenosi danych lokalnych i NIE tworzy kont użytkowników.
begin;

create schema if not exists veyro_private;
revoke all on schema veyro_private from public, anon, authenticated;
grant usage on schema veyro_private to authenticated;

create table public.veyro_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.veyro_members (
  workspace_id uuid not null references public.veyro_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  person_key text not null check (char_length(person_key) between 1 and 80),
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id),
  unique (workspace_id,person_key)
);
create index veyro_members_user_idx on public.veyro_members(user_id);

create table public.veyro_entities (
  workspace_id uuid not null references public.veyro_workspaces(id) on delete cascade,
  collection text not null check (collection in (
    'clients','tasks','events','ideas','activity','contactLog','files','settings','team'
  )),
  id text not null check (char_length(id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  revision bigint not null default 1 check (revision>0),
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (workspace_id,collection,id),
  constraint veyro_payload_limit check (octet_length(payload::text)<=2097152)
);
create index veyro_entities_changes_idx on public.veyro_entities(workspace_id,updated_at);

-- Funkcja odczytuje członkostwo jako właściciel tabeli. Dzięki temu polityki
-- członkostwa nie wywołują się rekurencyjnie. Identyfikator użytkownika pochodzi
-- z prawdziwego tokena Supabase Auth, a nie z parametru podanego przez przeglądarkę.
create function veyro_private.is_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.veyro_members m
    where m.workspace_id=p_workspace and m.user_id=(select auth.uid())
  );
$$;
revoke all on function veyro_private.is_member(uuid) from public,anon;
grant execute on function veyro_private.is_member(uuid) to authenticated;

alter table public.veyro_workspaces enable row level security;
alter table public.veyro_members enable row level security;
alter table public.veyro_entities enable row level security;
revoke all on public.veyro_workspaces,public.veyro_members,public.veyro_entities from anon,authenticated;
grant select on public.veyro_workspaces,public.veyro_members,public.veyro_entities to authenticated;

create policy veyro_workspace_read on public.veyro_workspaces
for select to authenticated using (veyro_private.is_member(id));
create policy veyro_members_read on public.veyro_members
for select to authenticated using (veyro_private.is_member(workspace_id));
create policy veyro_entities_read on public.veyro_entities
for select to authenticated using (veyro_private.is_member(workspace_id));

-- Jedyna ścieżka zapisu dla aplikacji. Każdy rekord ma wersję; nieaktualny
-- zapis kończy się konfliktem zamiast nadpisania zmian drugiej osoby.
create function public.veyro_write_entity(
  p_workspace uuid,
  p_collection text,
  p_id text,
  p_payload jsonb,
  p_expected_revision bigint,
  p_deleted boolean default false
)
returns public.veyro_entities language plpgsql security definer set search_path=''
as $$
declare
  result public.veyro_entities;
  actor uuid := auth.uid();
begin
  if actor is null or not veyro_private.is_member(p_workspace) then
    raise exception 'Brak dostępu do przestrzeni VEYRO' using errcode='42501';
  end if;
  if p_expected_revision is null or p_expected_revision<0
     or p_payload is null or jsonb_typeof(p_payload)<>'object'
     or p_deleted is null then
    raise exception 'Nieprawidłowy zapis VEYRO' using errcode='22023';
  end if;
  if p_expected_revision=0 then
    if p_deleted then
      raise exception 'Nie można usunąć nieistniejącego rekordu' using errcode='22023';
    end if;
    insert into public.veyro_entities(workspace_id,collection,id,payload,revision,updated_by)
    values(p_workspace,p_collection,p_id,p_payload,1,actor)
    on conflict (workspace_id,collection,id) do nothing returning * into result;
  else
    update public.veyro_entities
    set payload=p_payload,revision=revision+1,updated_at=clock_timestamp(),
        updated_by=actor,deleted_at=case when p_deleted then clock_timestamp() else null end
    where workspace_id=p_workspace and collection=p_collection and id=p_id
      and revision=p_expected_revision
    returning * into result;
  end if;
  if result.id is null then
    raise exception 'Konflikt wersji: odśwież dane i ponów edycję' using errcode='40001';
  end if;
  return result;
end;
$$;
revoke all on function public.veyro_write_entity(uuid,text,text,jsonb,bigint,boolean) from public,anon;
grant execute on function public.veyro_write_entity(uuid,text,text,jsonb,bigint,boolean) to authenticated;

-- Konto z kluczem serwerowym jest administracyjne; nigdy nie trafia do HTML/JS.
grant all on public.veyro_workspaces,public.veyro_members,public.veyro_entities to service_role;

-- Zmiany rekordów mogą być subskrybowane przez Supabase Realtime, po RLS.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='veyro_entities') then
    alter publication supabase_realtime add table public.veyro_entities;
  end if;
end;
$$;

commit;
