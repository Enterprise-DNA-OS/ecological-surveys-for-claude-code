create unique index projects_code_folded on projects(lower(code));
create unique index surveys_code_folded on surveys(lower(code));
create unique index observations_code_folded on observations(lower(code));
create unique index actions_code_folded on actions(lower(code));
alter table projects add constraint project_required_text check(length(trim(name))>0 and length(trim(owner))>0 and length(trim(jurisdiction))>0);
alter table surveys add constraint survey_required_text check(length(trim(code))>0 and length(trim(site))>0 and length(trim(observer))>0 and length(trim(method))>0);
alter table observations add constraint observation_required_text check(length(trim(code))>0 and length(trim(scientific_name))>0);
alter table actions add constraint action_required_text check(length(trim(code))>0 and length(trim(description))>0 and length(trim(owner))>0);
