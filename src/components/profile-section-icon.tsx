import { Award, BookOpen, CalendarCheck, CalendarDays, Clapperboard, Drama, GraduationCap, HeartHandshake, Images, Languages, LockKeyhole, Pin, Play, Ruler, Share2, Shirt, Sparkles, UserRound } from 'lucide-react';

const icons={
 roles:Drama,
 pinned:Pin,
 showreels:Play,
 skills:Sparkles,
 languages:Languages,
 credits:Clapperboard,
 training:GraduationCap,
 recognition:Award,
 photos:Images,
 measurements:Ruler,
 clothing:Shirt,
 preferences:HeartHandshake,
 education:BookOpen,
 booking:CalendarCheck,
 callsheet:CalendarDays,
 sharing:Share2,
 details:UserRound,
 privacy:LockKeyhole,
} as const;

export type ProfileIconKind=keyof typeof icons;
export function ProfileSectionIcon({kind,small=false}:{kind:ProfileIconKind;small?:boolean}){
 const Icon=icons[kind];
 return <span className={'profile-heading-icon'+(small?' profile-heading-icon-small':'')} aria-hidden="true"><Icon size={small?17:20} strokeWidth={1.8}/></span>;
}
