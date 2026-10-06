CREATE TABLE public.data_modul (
  modul text NOT NULL,
  lembar text NOT NULL,
  kunci text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (modul, lembar, kunci)
);
GRANT ALL ON public.data_modul TO service_role;
ALTER TABLE public.data_modul ENABLE ROW LEVEL SECURITY;