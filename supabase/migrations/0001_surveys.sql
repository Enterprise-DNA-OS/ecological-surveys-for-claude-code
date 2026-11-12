create table projects (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code))>0), name text not null,
 owner text not null, jurisdiction text not null default 'NZ', client text not null default '', review_due date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table import_batches (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), sha256 text not null,
 filename text not null, source_base64 text not null, mapping jsonb not null, actor text not null, row_count integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,sha256)
);
create table surveys (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id), code text not null unique,
 site text not null, surveyed_on date not null, observer text not null, method text not null,
 latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 effort_minutes integer check(effort_minutes>0), evidence_ref text not null default '',
 permit_required boolean not null default false, permit_ref text not null default '', permit_from date, permit_until date,
 permit_scope text not null default '', applicability_basis text not null default '', review_due date not null,
 revision integer not null default 1, source_fields jsonb not null default '{}', import_id uuid references import_batches(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((latitude is null)=(longitude is null)), check(permit_from is null or permit_until is null or permit_until>=permit_from)
);
create table observations (
 id uuid primary key default gen_random_uuid(), survey_id uuid not null references surveys(id), code text not null unique,
 scientific_name text not null, count integer not null check(count>=0), identification text not null check(identification in ('confirmed','provisional')),
 sensitive boolean not null default false, evidence_ref text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), survey_id uuid not null references surveys(id), code text not null unique,
 description text not null, owner text not null, due_on date not null, completed_at timestamptz, completion_evidence text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((completed_at is null and completion_evidence is null) or (completed_at is not null and length(trim(completion_evidence))>0))
);
create table reviews (
 id uuid primary key default gen_random_uuid(), survey_id uuid not null references surveys(id), revision integer not null,
 reviewer text not null, evidence text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(survey_id,revision)
);
create table notes (
 id uuid primary key default gen_random_uuid(), survey_id uuid not null references surveys(id), actor text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid not null, operation text not null,
 actor text not null, before_row jsonb, after_row jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function append_only() returns trigger language plpgsql as $$ begin raise exception 'Record is append-only'; end $$;
create function stamp() returns trigger language plpgsql as $$ begin new.updated_at=now(); if TG_TABLE_NAME='surveys' then new.revision=old.revision+1; end if; return new; end $$;
create function audit_change() returns trigger language plpgsql as $$ begin
 insert into audit_log(entity,entity_id,operation,actor,before_row,after_row) values(TG_TABLE_NAME,new.id,TG_OP,coalesce(nullif(current_setting('app.actor',true),''),'database operator'),case when TG_OP='UPDATE' then to_jsonb(old) else null end,to_jsonb(new)); return new; end $$;
create function touch_survey() returns trigger language plpgsql as $$ begin update surveys set updated_at=now() where id=new.survey_id; return new; end $$;
do $$ declare n text; begin
 foreach n in array array['projects','import_batches','surveys','observations','actions','reviews','notes','audit_log'] loop
 execute format('alter table %I enable row level security',n);
 execute format('revoke all on %I from public',n);
 execute format('create trigger no_delete before delete on %I for each row execute function append_only()',n);
 if n in ('import_batches','reviews','notes','audit_log') then
 execute format('create trigger no_update before update on %I for each row execute function append_only()',n);
 else execute format('create trigger update_stamp before update on %I for each row execute function stamp()',n); end if;
 if n<>'audit_log' then execute format('create trigger change_log after insert or update on %I for each row execute function audit_change()',n); end if;
 end loop;
end $$;
create trigger observation_revision after insert or update on observations for each row execute function touch_survey();
create trigger action_revision after insert or update on actions for each row execute function touch_survey();
create index surveys_project_idx on surveys(project_id);
create index observations_survey_idx on observations(survey_id);
create index actions_survey_idx on actions(survey_id);
create view survey_register as
 select s.*, p.code project, p.owner project_owner,
 exists(select 1 from reviews r where r.survey_id=s.id and r.revision=s.revision) reviewed,
 (select count(*)::int from observations o where o.survey_id=s.id) observation_count,
 (select count(*)::int from actions a where a.survey_id=s.id and a.completed_at is null) open_actions
 from surveys s join projects p on p.id=s.project_id;
create view record_checks as
 select id survey_id, code, 'LOCATION' rule, 'Record both latitude and longitude' finding from surveys where latitude is null
 union all select id,code,'EFFORT','Record positive survey effort in minutes' from surveys where effort_minutes is null
 union all select id,code,'EVIDENCE','Link the field evidence archive' from surveys where trim(evidence_ref)=''
 union all select id,code,'APPLICABILITY','Record why permission is or is not required' from surveys where trim(applicability_basis)=''
 union all select id,code,'PERMISSION','Required permission has missing reference, scope or date coverage' from surveys
 where permit_required and (trim(permit_ref)='' or trim(permit_scope)='' or permit_from is null or permit_until is null or surveyed_on not between permit_from and permit_until)
 union all select id,code,'FUTURE','Survey date is in the future' from surveys where surveyed_on>current_date
 union all select s.id,s.code,'IDENTIFICATION','Resolve provisional identification: '||o.scientific_name from surveys s join observations o on o.survey_id=s.id where o.identification='provisional'
 union all select s.id,s.code,'OBSERVATION-EVIDENCE','Link evidence for observation '||o.code from surveys s join observations o on o.survey_id=s.id where trim(o.evidence_ref)='';
create view review_queue as select code,project,site,observer,review_due,revision,open_actions,
 (select count(*)::int from record_checks c where c.survey_id=s.id) check_count
 from survey_register s where not reviewed;
create view actions_due as select a.code,s.code survey,p.code project,a.description,a.owner,a.due_on,current_date-a.due_on days_overdue
 from actions a join surveys s on s.id=a.survey_id join projects p on p.id=s.project_id where a.completed_at is null;
create view species_register as select p.code project,o.scientific_name,o.identification,o.sensitive,
 count(distinct s.id)::int surveys, sum(o.count)::int observed_count, min(s.surveyed_on) first_seen,max(s.surveyed_on) last_seen
 from observations o join surveys s on s.id=o.survey_id join projects p on p.id=s.project_id
 group by p.code,o.scientific_name,o.identification,o.sensitive;
revoke all on survey_register,record_checks,review_queue,actions_due,species_register from public;
