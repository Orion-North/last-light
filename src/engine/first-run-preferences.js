/** Sound is part of the first-run experience; only an explicit saved choice overrides it. */
export function initialSoundPreference(storedSettings) {
  return typeof storedSettings?.sound === 'boolean' ? storedSettings.sound : true;
}
