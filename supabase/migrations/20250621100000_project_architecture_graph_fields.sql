-- Interactive architecture graph fields for system and AI design diagrams

alter table projects
  add column if not exists architecture_nodes jsonb default null,
  add column if not exists architecture_edges jsonb default null,
  add column if not exists ai_design_nodes jsonb default null,
  add column if not exists ai_design_edges jsonb default null;

comment on column projects.architecture_nodes is 'System architecture graph nodes — [{ id, type, label, description?, icon?, position }]';
comment on column projects.architecture_edges is 'System architecture graph edges — [{ id, source, target, label?, animated? }]';
comment on column projects.ai_design_nodes is 'AI system design graph nodes — same schema as architecture_nodes';
comment on column projects.ai_design_edges is 'AI system design graph edges — same schema as architecture_edges';
