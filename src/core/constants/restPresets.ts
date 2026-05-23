export const REST_PRESETS = {
  SHORT: 60,
  MEDIUM: 90,
  LONG: 120,
  EXTRA_LONG: 180,
} as const

export type RestPreset = (typeof REST_PRESETS)[keyof typeof REST_PRESETS]
