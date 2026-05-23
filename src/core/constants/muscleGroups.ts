export const MUSCLE_GROUPS = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Jambes',
  'Quadriceps',
  'Ischio-jambiers',
  'Fessiers',
  'Mollets',
  'Abdominaux',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const SHOULDER_EXERCISES = [
  'Élévations latérales haltères',
  'Développé militaire haltères',
  'Oiseau haltères',
]
