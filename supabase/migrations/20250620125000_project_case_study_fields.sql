-- Case study structured fields for project detail pages
alter table projects
  add column if not exists overview text,
  add column if not exists problem text,
  add column if not exists why_built text,
  add column if not exists approach text,
  add column if not exists ai_design text,
  add column if not exists architecture text,
  add column if not exists challenges jsonb not null default '[]'::jsonb,
  add column if not exists results text,
  add column if not exists learnings text;

comment on column projects.overview is 'What the project is — short paragraphs for the Overview section';
comment on column projects.problem is 'Problem statement — pain, frustration, business impact';
comment on column projects.why_built is 'Why the project was created — engineering motivation';
comment on column projects.approach is 'Solution process — one step per line';
comment on column projects.ai_design is 'AI system flow — one agent/node per line';
comment on column projects.architecture is 'Architecture flow — one layer per line';
comment on column projects.challenges is 'Array of {challenge, solution} objects';
comment on column projects.results is 'Outcomes — one result per line';
comment on column projects.learnings is 'Key learnings — one insight per line';
