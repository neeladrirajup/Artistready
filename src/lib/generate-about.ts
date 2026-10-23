import type { Draft } from './profile-model';

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
const list = (items: string[], limit = 3) => {
  const values = [...new Set(items.map(clean).filter(Boolean))].slice(0, limit);
  if (values.length < 2) return values[0] || '';
  return `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
};

/** Build a public-facing draft from professional choices only. Never include private boundaries or personal measurements. */
export function generateAbout(draft: Pick<Draft,
  'name' | 'role' | 'city' | 'experience' | 'castingRoles' | 'skills' | 'languages' | 'available'
>): string {
  const name = clean(draft.name);
  const role = clean(draft.role);
  const city = clean(draft.city);
  if (!name && !role) return '';

  const craft = role === 'Other creative' ? 'creative professional' : role.toLowerCase();
  const article = /^[aeiou]/.test(craft) ? 'an' : 'a';
  const sentences = [
    `I'm ${name ? `${name}, ` : ''}${article} ${craft}${city ? ` based in ${city}` : ''}.`,
  ];
  if (draft.experience && draft.experience !== 'Starting out') {
    sentences.push(`I have ${clean(draft.experience)} of experience.`);
  }
  const roles = list(draft.castingRoles);
  if (roles) sentences.push(`I'm interested in roles such as ${roles}.`);
  const skills = list(draft.skills, Number.POSITIVE_INFINITY);
  if (skills) sentences.push(`My skills include ${skills}.`);
  const languages = list(draft.languages);
  if (languages) sentences.push(`I work in ${languages}.`);
  if (draft.available) sentences.push("I'm open to new projects and collaborations.");
  return sentences.reduce((text, sentence) => {
    const next = text ? `${text} ${sentence}` : sentence;
    return next.length <= 600 ? next : text;
  }, '');
}
