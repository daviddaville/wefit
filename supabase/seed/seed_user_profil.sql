-- ============================================================
-- Seed — Profil David + programme haltères (données de test)
-- À exécuter après avoir créé le compte via Supabase Auth
-- Remplacer USER_UUID par l'UUID réel de auth.users
-- ============================================================

do $$
declare
  v_user_id     uuid := 'USER_UUID'; -- Remplacer
  v_program_id  uuid := gen_random_uuid();
  v_haut_a      uuid := gen_random_uuid();
  v_haut_b      uuid := gen_random_uuid();
  v_bas_a       uuid := gen_random_uuid();
  v_bas_b       uuid := gen_random_uuid();
begin

-- Profil utilisateur
update public.users set
  full_name      = 'David',
  age            = 46,
  height_cm      = 187.00,
  weight_kg      = 112.00,
  goal_weight_kg = 100.00
where id = v_user_id;

-- Programme actif
insert into public.programs (id, user_id, name, description, is_active) values
  (v_program_id, v_user_id, 'Recomposition Haltères 46ans',
   'Programme 4 séances/semaine Haut A/B · Bas A/B. Matériel : haltères + banc inclinable.', true);

-- Séances
insert into public.workout_days (id, program_id, name, day_order, notes) values
  (v_haut_a, v_program_id, 'Haut A', 1, 'Pectoraux / Dos / Épaules'),
  (v_haut_b, v_program_id, 'Haut B', 2, 'Biceps / Triceps / Épaules'),
  (v_bas_a,  v_program_id, 'Bas A',  3, 'Quadriceps / Fessiers'),
  (v_bas_b,  v_program_id, 'Bas B',  4, 'Ischio-jambiers / Mollets');

-- Exercices (catalogue global)
insert into public.exercises (name, muscle_group, equipment, default_rest_seconds, joint_notes) values
  ('Développé incliné haltères',      'Pectoraux',          'haltères, banc inclinable', 90,  null),
  ('Rowing haltère unilatéral',       'Dos',                'haltères, banc inclinable', 90,  null),
  ('Élévations latérales haltères',   'Épaules',            'haltères',                  60,  'Max +2.5kg/semaine'),
  ('Curl haltères',                   'Biceps',             'haltères',                  60,  null),
  ('Extension triceps haltère',       'Triceps',            'haltères, banc inclinable', 60,  null),
  ('Développé militaire haltères',    'Épaules',            'haltères',                  90,  'Max +2.5kg/semaine'),
  ('Goblet squat haltère',            'Quadriceps',         'haltères',                  90,  null),
  ('Hip thrust haltère',              'Fessiers',           'haltères, banc inclinable', 90,  null),
  ('Romanian deadlift haltères',      'Ischio-jambiers',    'haltères',                  90,  null),
  ('Mollets debout haltères',         'Mollets',            'haltères',                  60,  null)
on conflict (name) do nothing;

-- Séance Haut A
insert into public.sets_config
  (workout_day_id, exercise_id, exercise_order, sets_count, rep_range_min, rep_range_max, rest_seconds, initial_weight_kg, current_weight_kg)
select v_haut_a, id, 1, 4, 8, 12, 90, 20, 20 from public.exercises where name = 'Développé incliné haltères'
union all
select v_haut_a, id, 2, 4, 8, 12, 90, 16, 16 from public.exercises where name = 'Rowing haltère unilatéral'
union all
select v_haut_a, id, 3, 3, 12, 15, 60, 8,  8  from public.exercises where name = 'Élévations latérales haltères';

-- Séance Haut B
insert into public.sets_config
  (workout_day_id, exercise_id, exercise_order, sets_count, rep_range_min, rep_range_max, rest_seconds, initial_weight_kg, current_weight_kg)
select v_haut_b, id, 1, 3, 10, 15, 60, 14, 14 from public.exercises where name = 'Curl haltères'
union all
select v_haut_b, id, 2, 3, 10, 15, 60, 12, 12 from public.exercises where name = 'Extension triceps haltère'
union all
select v_haut_b, id, 3, 4, 8,  12, 90, 16, 16 from public.exercises where name = 'Développé militaire haltères';

-- Séance Bas A
insert into public.sets_config
  (workout_day_id, exercise_id, exercise_order, sets_count, rep_range_min, rep_range_max, rest_seconds, initial_weight_kg, current_weight_kg)
select v_bas_a, id, 1, 4, 10, 15, 90, 24, 24 from public.exercises where name = 'Goblet squat haltère'
union all
select v_bas_a, id, 2, 4, 10, 15, 90, 28, 28 from public.exercises where name = 'Hip thrust haltère';

-- Séance Bas B
insert into public.sets_config
  (workout_day_id, exercise_id, exercise_order, sets_count, rep_range_min, rep_range_max, rest_seconds, initial_weight_kg, current_weight_kg)
select v_bas_b, id, 1, 4, 10, 12, 90, 20, 20 from public.exercises where name = 'Romanian deadlift haltères'
union all
select v_bas_b, id, 2, 3, 15, 20, 60, 14, 14 from public.exercises where name = 'Mollets debout haltères';

end $$;
