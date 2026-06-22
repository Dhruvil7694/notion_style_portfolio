-- Migrate case study fields to structured types:
-- approach, results, learnings → text[]
-- ai_design, architecture → jsonb (array of { label })

create or replace function migrate_diagram_text_to_nodes(source text)
returns jsonb
language plpgsql
immutable
as $$
declare
  lines text[];
  line text;
  nodes jsonb := '[]'::jsonb;
  label text;
begin
  if source is null or trim(source) = '' then
    return null;
  end if;

  if source ~* '^(flowchart|graph)\s' then
    for label in
      select (regexp_matches(source, '\["([^"\\]*)"\\]', 'g'))[1]
    loop
      if label is not null and trim(label) <> '' then
        nodes := nodes || jsonb_build_array(jsonb_build_object('label', trim(label)));
      end if;
    end loop;

    if jsonb_array_length(nodes) > 0 then
      return nodes;
    end if;

    return null;
  end if;

  lines := string_to_array(source, E'\n');

  foreach line in array lines loop
    if trim(line) <> '' then
      nodes := nodes || jsonb_build_array(jsonb_build_object('label', trim(line)));
    end if;
  end loop;

  if jsonb_array_length(nodes) = 0 then
    return null;
  end if;

  return nodes;
end;
$$;

create or replace function migrate_text_lines_to_array(source text)
returns text[]
language sql
immutable
as $$
  select case
    when source is null or trim(source) = '' then null
    else array(
      select trim(line)
      from unnest(string_to_array(source, E'\n')) as line
      where trim(line) <> ''
    )
  end;
$$;

alter table projects
  alter column approach type text[] using migrate_text_lines_to_array(approach),
  alter column results type text[] using migrate_text_lines_to_array(results),
  alter column learnings type text[] using migrate_text_lines_to_array(learnings),
  alter column ai_design type jsonb using migrate_diagram_text_to_nodes(ai_design),
  alter column architecture type jsonb using migrate_diagram_text_to_nodes(architecture);

comment on column projects.approach is 'Ordered solution steps — text array';
comment on column projects.ai_design is 'AI system flow — JSON array of { label } nodes';
comment on column projects.architecture is 'Architecture flow — JSON array of { label } nodes';
comment on column projects.results is 'Outcomes — text array';
comment on column projects.learnings is 'Key learnings — text array';

drop function migrate_diagram_text_to_nodes(text);
drop function migrate_text_lines_to_array(text);
