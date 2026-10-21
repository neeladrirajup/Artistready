export const crafts = ['Actor', 'Actress', 'Director', 'Writer', 'Cinematographer', 'Other creative'] as const;

export const craftRoles: Record<string, readonly string[]> = {
  Actor: ['Hero / Lead', 'Second Lead', 'Hero’s Friend', 'Hero’s Brother', 'Character Artist', 'Supporting Artist', 'Villain', 'Villain’s Aide', 'Rowdy', 'Rowdy Gang Member', 'Comedian', 'Father', 'Son', 'Husband', 'Police Officer', 'Doctor', 'Lawyer', 'Teacher', 'Narrator / Voice Actor', 'Child Artist', 'Background Artist'],
  Actress: ['Heroine / Lead', 'Second Lead', 'Heroine’s Friend', 'Heroine’s Sister', 'Character Artist', 'Supporting Artist', 'Villain', 'Villain’s Aide', 'Comedian', 'Mother', 'Daughter', 'Wife', 'Police Officer', 'Doctor', 'Lawyer', 'Teacher', 'Narrator / Voice Actor', 'Child Artist', 'Background Artist'],
  Director: ['Feature Film Director', 'Short Film Director', 'Series Director', 'Television Director', 'Commercial Director', 'Music Video Director', 'Documentary Director', 'Theatre Director', 'Assistant Director', 'Associate Director', 'Second Unit Director', 'Casting Director'],
  Writer: ['Story Writer', 'Screenwriter', 'Dialogue Writer', 'Co-writer', 'Script Doctor', 'Series Writer', 'Episode Writer', 'Adaptation Writer', 'Comedy Writer', 'Lyricist', 'Copywriter', 'Theatre Playwright'],
  Cinematographer: ['Director of Photography', 'Camera Operator', 'Second Unit Cinematographer', 'Documentary Cinematographer', 'Commercial Cinematographer', 'Music Video Cinematographer', 'Drone Cinematographer', 'Steadicam Operator', 'Focus Puller / 1st AC', 'Camera Assistant / 2nd AC', 'Lighting Camera Operator'],
  'Other creative': ['Editor', 'Production Designer', 'Art Director', 'Costume Designer', 'Makeup Artist', 'Hair Stylist', 'Choreographer', 'Stunt Performer', 'Action Director', 'Composer', 'Sound Designer', 'Sound Recordist', 'Colourist', 'VFX Artist', 'Animator', 'Singer', 'Dancer', 'Model', 'Voice Artist', 'Photographer', 'Producer', 'Production Manager', 'Production Coordinator', 'Casting Assistant', 'Script Supervisor', 'Location Manager', 'Intimacy Coordinator'],
};

export function rolesForCraft(craft: string): readonly string[] { return craftRoles[craft] ?? []; }
