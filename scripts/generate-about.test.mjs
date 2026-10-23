import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAbout } from '../src/lib/generate-about.ts';

test('builds a concise introduction from selected professional fields', () => {
  const about = generateAbout({
    name: 'Saanvi Reddy', role: 'Actress', city: 'Hyderabad',
    experience: '3–5 years', castingRoles: ['Lead', 'Supporting Artist'],
    skills: ['Dance', 'Swimming', 'Voice-over', 'Bharatanatyam'], languages: ['Telugu', 'Hindi'], available: true,
  });
  assert.match(about, /^I'm Saanvi Reddy, an actress based in Hyderabad\./);
  assert.match(about, /I'm interested in roles such as Lead and Supporting Artist/);
  assert.match(about, /Dance, Swimming/);
  assert.match(about, /Bharatanatyam/);
  assert.match(about, /I work in Telugu and Hindi/);
  assert.match(about, /I'm open to new projects/);
  assert.doesNotMatch(about, /\bThey\b|\bTheir\b/);
});

test('does not expose personal or boundary fields and stays within the About limit', () => {
  const about = generateAbout({
    name: 'Artist', role: 'Actor', city: 'Chennai', experience: 'Starting out',
    castingRoles: Array(5).fill('A'.repeat(120)),
    skills: ['B'.repeat(120), 'C'.repeat(120), 'D'.repeat(120)],
    languages: ['Telugu'], available: false,
    maritalStatus: 'Married', occupation: 'Teacher', preferences: 'Private',
  });
  assert.ok(about.length <= 600);
  assert.doesNotMatch(about, /Married|Teacher|Private/);
  assert.doesNotMatch(about, /open to new projects/);
});
