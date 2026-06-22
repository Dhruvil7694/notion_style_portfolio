-- Phase 11: project asset management and visual storytelling

alter table projects
  add column if not exists thumbnail text,
  add column if not exists demo_video_url text,
  add column if not exists architecture_image text,
  add column if not exists gallery jsonb default null;

comment on column projects.thumbnail is 'Card/list thumbnail URL — falls back to cover_image when empty';
comment on column projects.demo_video_url is 'Demo video URL (YouTube, Vimeo, or direct MP4/WebM)';
comment on column projects.architecture_image is 'Static architecture diagram or screenshot for the architecture section';
comment on column projects.gallery is 'Typed project gallery — [{ url, type, caption?, alt? }]';
