export type Crop = { file: string; x: number; y: number; w: number; h: number };
export const artwork: Record<string, Crop> = {
  saanvi: { file: 'profile', x: 42, y: 138, w: 430, h: 353 },
  arjun: { file: 'cinematic', x: 49, y: 738, w: 345, h: 204 },
  meera: { file: 'cinematic', x: 492, y: 737, w: 334, h: 207 },
  vikram: { file: 'cinematic', x: 48, y: 1167, w: 341, h: 202 },
  rhea: { file: 'cinematic', x: 492, y: 1167, w: 333, h: 202 },
  studio: { file: 'signin', x: 0, y: 160, w: 940, h: 217 },
  spotlight: { file: 'profile', x: 46, y: 837, w: 513, h: 170 },
};
export type Artist = { id: string; name: string; role: string; category: string; city: string; image: string; tagline: string; languages: string[]; skills: string[]; available: boolean; credits: number; experience: number; age: number; gender: string; genres: string[] };
export const categories = ['All', 'Actors', 'Actresses', 'Directors', 'Writers', 'Crew'];
export const artists: Artist[] = [
  { id: 'ananya-rao', name: 'Saanvi Reddy', role: 'Actress', category: 'Actresses', city: 'Hyderabad', image: 'saanvi', tagline: 'Actor passionate about meaningful stories across film, OTT and theatre.', languages: ['Telugu', 'Hindi', 'English'], skills: ['Dance', 'Swimming', 'Driving', 'Karate'], available: true, credits: 28, experience: 3, age: 26, gender: 'Female', genres: ['Drama', 'Comedy', 'Romance'] },
  { id: 'arjun-mehta', name: 'Arjun Varma', role: 'Actor', category: 'Actors', city: 'Hyderabad', image: 'arjun', tagline: 'Bringing authenticity and a little edge to every character.', languages: ['Telugu', 'Hindi', 'English'], skills: ['Dance', 'Driving', 'Swimming'], available: true, credits: 18, experience: 5, age: 29, gender: 'Male', genres: ['Action', 'Drama', 'Romance'] },
  { id: 'meera-krishnan', name: 'Meera Nair', role: 'Actress', category: 'Actresses', city: 'Mumbai', image: 'meera', tagline: 'A different perspective. An unforgettable story.', languages: ['Hindi', 'English', 'Malayalam'], skills: ['Dance', 'Swimming'], available: true, credits: 24, experience: 4, age: 27, gender: 'Female', genres: ['Drama', 'Comedy', 'Thriller'] },
  { id: 'kabir-shah', name: 'Vikram Shetty', role: 'Director', category: 'Directors', city: 'Bengaluru', image: 'vikram', tagline: 'Finding the extraordinary in stories worth telling.', languages: ['Kannada', 'English', 'Hindi'], skills: ['Driving', 'Screenwriting'], available: false, credits: 16, experience: 7, age: 34, gender: 'Male', genres: ['Drama', 'Action', 'Period'] },
  { id: 'tara-menon', name: 'Rhea Kapoor', role: 'Writer', category: 'Writers', city: 'Hyderabad', image: 'rhea', tagline: 'Characters with a heartbeat. Stories that stay.', languages: ['Hindi', 'English', 'Telugu'], skills: ['Screenwriting', 'Driving'], available: true, credits: 21, experience: 3, age: 28, gender: 'Female', genres: ['Drama', 'Romance', 'Family'] },
  { id: 'rohan-reddy', name: 'Rohan Reddy', role: 'Cinematographer', category: 'Crew', city: 'Hyderabad', image: 'vikram', tagline: 'Chasing light, one story at a time.', languages: ['Telugu', 'English'], skills: ['Cinematography', 'Driving'], available: true, credits: 32, experience: 6, age: 32, gender: 'Male', genres: ['Drama', 'Thriller'] },
  { id: 'ishaan-verma', name: 'Ishaan Verma', role: 'Actor', category: 'Actors', city: 'Bengaluru', image: 'arjun', tagline: 'A new character. A different perspective.', languages: ['Hindi', 'English'], skills: ['Dance', 'Karate'], available: false, credits: 15, experience: 4, age: 30, gender: 'Male', genres: ['Action', 'Thriller'] },
  { id: 'diya-nair', name: 'Diya Nair', role: 'Costume designer', category: 'Crew', city: 'Chennai', image: 'rhea', tagline: 'Building characters through what they wear.', languages: ['Tamil', 'Malayalam', 'English'], skills: ['Costume design', 'Swimming'], available: true, credits: 19, experience: 5, age: 31, gender: 'Female', genres: ['Period', 'Drama'] },
];
