-- Project detail V2: metrics, tradeoffs, contribution, categorized stack, timeline, demo images

alter table projects
  add column if not exists metrics jsonb not null default '[]'::jsonb,
  add column if not exists tradeoffs jsonb not null default '[]'::jsonb,
  add column if not exists my_contribution text[] default null,
  add column if not exists tech_stack_groups jsonb default null,
  add column if not exists timeline jsonb default null,
  add column if not exists demo_images jsonb default null;

comment on column projects.metrics is 'Impact metrics — [{ label, value }]';
comment on column projects.tradeoffs is 'Engineering tradeoffs — [{ decision, tradeoff }]';
comment on column projects.my_contribution is 'Personal contribution bullets';
comment on column projects.tech_stack_groups is 'Categorized stack — [{ category, items[] }]';
comment on column projects.timeline is 'Optional project timeline — [{ period, title, description? }]';
comment on column projects.demo_images is 'Optional screenshots — [{ url, caption?, alt? }]';
