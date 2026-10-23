import type { Draft } from './profile-model';

export const profileSectionKeys={
 roles:['castingRoles','additionalRoles'],pinned:['pinnedMedia'],
 booking:['callSheet','available','bookingAvailableFrom','bookingTravel','bookingLocations','bookingRepresentative','bookingEmail','bookingPhone','bookingNotes','showBookingContact'],
 essentials:['name','role','castingRoles','stateCode','city','experience','gender','genderDescription','maritalStatus','workStatus','occupation','ageFrom','ageTo','available'],
 about:['bio'],skills:['skills','skillCategories'],languages:['languages'],credits:['credits'],
 training:['training'],recognition:['recognition'],
 measurements:['hairStyle','hairColor','bodyBuild','bodyBuildDescription','measurementFit','heightFeet','heightInches','weight','chest','bust','waist','hip'],
 clothing:['clothing'],education:['education'],photos:['photo','coverId'],showreels:['reel','reelLinks']
} as const satisfies Record<string,readonly (keyof Draft)[]>;

export type ProfileSection=keyof typeof profileSectionKeys;
export function sectionPatch(section:ProfileSection,draft:Draft){
 return Object.fromEntries(profileSectionKeys[section].map(key=>[key,draft[key]]));
}
