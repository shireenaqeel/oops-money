// moods.ts — mood options shown while logging an expense. Used later for mood↔spending insights (Feature 7).
export interface Mood {
  id: string;
  emoji: string;
  label: string;
}

export const MOODS: Mood[] = [
  { id: 'happy', emoji: '😊', label: 'happy' },
  { id: 'treat', emoji: '🥳', label: 'treat' },
  { id: 'meh', emoji: '😐', label: 'meh' },
  { id: 'stressed', emoji: '😩', label: 'stressed' },
  { id: 'sad', emoji: '😔', label: 'sad' },
  { id: 'bored', emoji: '🥱', label: 'bored' },
];
