export type Artist = {
  id: string; name: string; role: string; category: string; city: string; image: string;
  tagline: string; languages: string[]; skills: string[]; available: boolean; credits: number;
};
export const categories = ['All talent', 'Actors', 'Models', 'Dancers', 'Musicians', 'Photographers', 'Film crew', 'Stylists'];
export const artists: Artist[] = [
  { id: 'ananya-rao', name: 'Ananya Rao', role: 'Actor · Dancer', category: 'Actors', city: 'Hyderabad', image: 'photo-1534528741775-53994a69daeb', tagline: 'Finding the extraordinary in everyday stories.', languages: ['Telugu', 'English', 'Hindi'], skills: ['Screen acting', 'Kuchipudi', 'Voice acting'], available: true, credits: 12 },
  { id: 'arjun-mehta', name: 'Arjun Mehta', role: 'Actor · Model', category: 'Actors', city: 'Mumbai', image: 'photo-1500648767791-00dcc994a43e', tagline: 'A new character. A different perspective.', languages: ['Hindi', 'English', 'Marathi'], skills: ['Screen acting', 'Theatre', 'Modelling'], available: true, credits: 18 },
  { id: 'meera-krishnan', name: 'Meera Krishnan', role: 'Dancer · Choreographer', category: 'Dancers', city: 'Chennai', image: 'photo-1524504388940-b1c1722653e1', tagline: 'Stories told through movement.', languages: ['Tamil', 'English'], skills: ['Bharatanatyam', 'Contemporary', 'Choreography'], available: true, credits: 24 },
  { id: 'kabir-shah', name: 'Kabir Shah', role: 'Musician · Composer', category: 'Musicians', city: 'Bengaluru', image: 'photo-1535713875002-d1d0cf377fde', tagline: 'Making music that stays with you.', languages: ['Hindi', 'English'], skills: ['Composition', 'Guitar', 'Vocals'], available: false, credits: 16 },
  { id: 'tara-menon', name: 'Tara Menon', role: 'Model · Creator', category: 'Models', city: 'Mumbai', image: 'photo-1524250502761-1ac6f2e30d43', tagline: 'A little curiosity. A lot of possibility.', languages: ['Malayalam', 'English', 'Hindi'], skills: ['Editorial', 'Commercial', 'Runway'], available: true, credits: 21 },
  { id: 'rohan-reddy', name: 'Rohan Reddy', role: 'Photographer · Filmmaker', category: 'Photographers', city: 'Hyderabad', image: 'photo-1506794778202-cad84cf45f1d', tagline: 'Honest frames. Unforgettable people.', languages: ['Telugu', 'English'], skills: ['Portraiture', 'Cinematography', 'Editing'], available: true, credits: 32 },
  { id: 'ishaan-verma', name: 'Ishaan Verma', role: 'Cinematographer', category: 'Film crew', city: 'Bengaluru', image: 'photo-1506794778202-cad84cf45f1d', tagline: 'Chasing light, one story at a time.', languages: ['Hindi', 'English'], skills: ['Cinematography', 'Lighting', 'Colour grading'], available: false, credits: 15 },
  { id: 'diya-nair', name: 'Diya Nair', role: 'Stylist · Costume designer', category: 'Stylists', city: 'Chennai', image: 'photo-1524250502761-1ac6f2e30d43', tagline: 'Building characters through what they wear.', languages: ['Tamil', 'Malayalam', 'English'], skills: ['Costume design', 'Editorial styling', 'Wardrobe'], available: true, credits: 19 },
];
export const portrait = (image: string, width = 700) => `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`;
