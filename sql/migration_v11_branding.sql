alter table public.site_config
  add column if not exists logo_url text;

alter table public.site_config
  add column if not exists about_title text not null default 'Notre histoire';

alter table public.site_config
  add column if not exists about_text text not null default
    'Depuis notre échoppe des Sablons, nous sélectionnons chaque pièce avec exigence et la travaillons à la main, dans le respect des traditions et des règles halal.';
