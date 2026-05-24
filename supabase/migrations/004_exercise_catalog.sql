-- Extend exercises with catalog metadata
ALTER TABLE public.exercises
  ADD COLUMN description         text,
  ADD COLUMN video_url           text,
  ADD COLUMN level               text NOT NULL DEFAULT 'base'
    CHECK (level IN ('base', 'advanced', 'finishing')),
  ADD COLUMN muscle_side         text NOT NULL DEFAULT 'anterior'
    CHECK (muscle_side IN ('anterior', 'posterior')),
  ADD COLUMN muscles_principaux  text[],
  ADD COLUMN muscles_secondaires text[];

-- ── Antérieurs / BASE ───────────────────────────────────────────────────────

UPDATE public.exercises SET
  level = 'base', muscle_side = 'anterior',
  description = 'Allongé sur un banc incliné à 30-45°, poussez les haltères en arc de cercle au-dessus de la poitrine. Coudes légèrement fléchis en haut, descente lente jusqu''à sentir l''étirement pectoral. Ne bloquez pas les coudes en extension.'
WHERE name = 'Développé incliné haltères';

UPDATE public.exercises SET
  level = 'base', muscle_side = 'anterior',
  description = 'Assis sur un banc, haltères à hauteur des épaules, poussez verticalement jusqu''à extension complète sans bloquer les coudes. Contrôlez la descente. Travaille l''ensemble du deltoïde avec accent sur le faisceau antérieur.'
WHERE name = 'Développé militaire haltères';

UPDATE public.exercises SET
  level = 'base', muscle_side = 'anterior',
  description = 'Tenez un haltère à deux mains contre la poitrine, descendez en squat profond en gardant le buste droit, genoux dans l''axe des pieds. L''haltère aide à contrebalancer et maintenir une posture verticale. Idéal pour débuter le squat.'
WHERE name = 'Goblet squat haltère';

UPDATE public.exercises SET
  level = 'advanced', muscle_side = 'anterior',
  description = 'Debout, légère flexion des genoux, montez les haltères latéralement jusqu''à hauteur des épaules en gardant les coudes légèrement fléchis. Évitez de hausser les épaules. Ne dépassez pas 2,5 kg de progression par semaine pour préserver les tendons.'
WHERE name = 'Élévations latérales haltères';

UPDATE public.exercises SET
  level = 'finishing', muscle_side = 'anterior',
  description = 'Assis ou debout, fléchissez les avant-bras vers les épaules en supination. Contrôlez la descente sur 3 secondes pour maximiser le travail excentrique des biceps. Évitez de balancer le buste.'
WHERE name = 'Curl haltères';

-- ── Postérieurs / BASE ──────────────────────────────────────────────────────

UPDATE public.exercises SET
  level = 'base', muscle_side = 'posterior',
  description = 'Un genou et une main appuyés sur le banc, tirez l''haltère vers la hanche en gardant le coude près du corps et le dos plat. En haut, contractez le dos 1 seconde. La traction doit venir du coude, pas de la main.'
WHERE name = 'Rowing haltère unilatéral';

UPDATE public.exercises SET
  level = 'base', muscle_side = 'posterior',
  description = 'Dos appuyé sur un banc, haltère posé sur les hanches, poussez le bassin vers le haut en contractant les fessiers. Maintenez 1 seconde en haut, descente lente. La puissance vient des fessiers, pas des lombaires.'
WHERE name = 'Hip thrust haltère';

UPDATE public.exercises SET
  level = 'base', muscle_side = 'posterior',
  description = 'Debout, haltères devant les cuisses, descendez en conservant le dos droit et les hanches en arrière jusqu''à sentir l''étirement des ischio-jambiers (mi-tibia). Remontez en poussant les hanches vers l''avant, pas en redressant le dos.'
WHERE name = 'Romanian deadlift haltères';

UPDATE public.exercises SET
  level = 'finishing', muscle_side = 'posterior',
  description = 'Assis ou debout, haltère tenu à deux mains au-dessus de la tête, descendez-le derrière la nuque en fléchissant les coudes. Gardez les coudes pointés vers le haut. Travaille principalement le long chef du triceps.'
WHERE name = 'Extension triceps haltère';

UPDATE public.exercises SET
  level = 'finishing', muscle_side = 'posterior',
  description = 'Debout sur une marche (si possible) pour amplifier la course, montez sur la pointe des pieds lentement, maintenez 1 seconde en contraction maximale, descente complète sous le niveau de la marche. Enchaînez sans rebond.'
WHERE name = 'Mollets debout haltères';
