do $$ declare p uuid; q uuid; s uuid; t uuid; u uuid; begin
 if exists(select 1 from projects where code='DEMO-ESTUARY') then return; end if;
 perform set_config('app.actor','Fictional demo seed',true);
 insert into projects(code,name,owner,jurisdiction,client,review_due) values('DEMO-ESTUARY','Estuary restoration baseline','Mira Chen','NZ','Fictional Estuary Trust',current_date+5) returning id into p;
 insert into projects(code,name,owner,jurisdiction,client,review_due) values('DEMO-DUNE','Dune vegetation monitoring','Ari Patel','NZ','Fictional Dune Trust',current_date-7) returning id into q;
 insert into surveys(project_id,code,site,surveyed_on,observer,method,latitude,longitude,effort_minutes,evidence_ref,review_due,applicability_basis)
 values(p,'EST-01','Estuary north transect',current_date-14,'Aroha Bell','Timed visual count',-41.28,174.78,30,'demo://field-book/est-01',current_date-3,'Visual observation only; project lead documented no handling or reserve entry in this fictional exercise') returning id into s;
 insert into surveys(project_id,code,site,surveyed_on,observer,method,effort_minutes,review_due,permit_required,permit_ref,permit_from,permit_until,permit_scope,applicability_basis)
 values(p,'EST-02','Estuary south sampling',current_date-8,'Tane Morgan','Marine reserve sample collection',45,current_date-1,true,'DEMO-PERM-01',current_date-90,current_date-10,'Sampling at south site','Marine reserve sample collection requires documented permission') returning id into t;
 insert into surveys(project_id,code,site,surveyed_on,observer,method,latitude,longitude,effort_minutes,evidence_ref,review_due,applicability_basis,created_at,updated_at)
 values(q,'DUNE-01','Dune quadrat A',current_date-45,'Aroha Bell','Vegetation quadrat',-41.3,174.8,20,'demo://field-book/dune-01',current_date-30,'Non-invasive vegetation observation; fictional site access checked by lead',now()-interval '45 days',now()-interval '45 days') returning id into u;
 insert into observations(survey_id,code,scientific_name,count,identification,sensitive,evidence_ref) values
 (s,'OBS-001','Austrovenus stutchburyi',18,'confirmed',false,'demo://photos/obs-001'),
 (t,'OBS-002','Austrovenus stutchburyi',7,'provisional',false,''),
 (u,'OBS-003','Ficinia spiralis',24,'confirmed',true,'demo://photos/obs-003');
 insert into actions(survey_id,code,description,owner,due_on) values
 (t,'ACT-01','Check permit date and actual activity with project lead','Mira Chen',current_date-4),
 (t,'ACT-02','Locate source photographs and confirm identification','Tane Morgan',current_date+2);
 insert into reviews(survey_id,revision,reviewer,evidence) select s,revision,'Mira Chen','Fictional field-book cross-check' from surveys where id=s;
 insert into notes(survey_id,actor,body) values(t,'Mira Chen','Fictional review: archive and permission gaps require follow-up; do not treat this as permission to sample.');
end $$;
