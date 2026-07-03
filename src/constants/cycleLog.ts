// cycleLog.ts — the options you can tap when logging a cycle day (flow, symptoms, mood).
// Inspired by Clue/Flo's daily-log chips, but Hinglish + non-clinical. Labels are [hinglish, english].
import { FlowLevel } from '../types';

export interface FlowOption {
  id: FlowLevel;
  label: [string, string];
  emoji: string;
}

// Bleeding intensity, lightest → heaviest.
export const FLOW_LEVELS: FlowOption[] = [
  { id: 'spotting', label: ['spotting', 'spotting'], emoji: '💧' },
  { id: 'light', label: ['halka', 'light'], emoji: '🩸' },
  { id: 'medium', label: ['medium', 'medium'], emoji: '🩸🩸' },
  { id: 'heavy', label: ['heavy', 'heavy'], emoji: '🩸🩸🩸' },
];

export interface ChipOption {
  id: string;
  label: [string, string];
  emoji: string;
}

// Common cycle symptoms she can toggle (multi-select).
export const CYCLE_SYMPTOMS: ChipOption[] = [
  { id: 'cramps', label: ['cramps', 'cramps'], emoji: '🌩️' },
  { id: 'headache', label: ['sar dard', 'headache'], emoji: '🤕' },
  { id: 'bloating', label: ['bloating', 'bloating'], emoji: '🎈' },
  { id: 'cravings', label: ['cravings', 'cravings'], emoji: '🍫' },
  { id: 'tired', label: ['thakaan', 'tired'], emoji: '😴' },
  { id: 'backache', label: ['kamar dard', 'backache'], emoji: '💢' },
  { id: 'acne', label: ['pimples', 'acne'], emoji: '🌋' },
  { id: 'tender', label: ['sore chest', 'sore chest'], emoji: '🫧' },
  { id: 'nausea', label: ['ulti feel', 'nausea'], emoji: '🤢' },
  { id: 'moodswings', label: ['mood swings', 'mood swings'], emoji: '🎭' },
  { id: 'energetic', label: ['energy high', 'energetic'], emoji: '⚡' },
  { id: 'discharge', label: ['discharge', 'discharge'], emoji: '💦' },
  // PCOS / hormonal-friendly symptoms
  { id: 'hairfall', label: ['baal jhadna', 'hair fall'], emoji: '💇‍♀️' },
  { id: 'extrahair', label: ['extra hair', 'extra hair'], emoji: '🧴' },
  { id: 'weight', label: ['weight change', 'weight change'], emoji: '⚖️' },
];

// How she's feeling emotionally (single-select).
export const CYCLE_MOODS: ChipOption[] = [
  { id: 'happy', label: ['khush', 'happy'], emoji: '😊' },
  { id: 'calm', label: ['calm', 'calm'], emoji: '😌' },
  { id: 'sensitive', label: ['sensitive', 'sensitive'], emoji: '🥺' },
  { id: 'irritable', label: ['chidchidi', 'irritable'], emoji: '😤' },
  { id: 'anxious', label: ['anxious', 'anxious'], emoji: '😰' },
  { id: 'sad', label: ['udaas', 'sad'], emoji: '😢' },
  { id: 'confident', label: ['confident', 'confident'], emoji: '💅' },
  { id: 'meh', label: ['meh', 'meh'], emoji: '😐' },
];

// Look up a chip's emoji+label by id from any of the lists (for read-only display).
export function findChip(list: ChipOption[], id: string): ChipOption | undefined {
  return list.find((c) => c.id === id);
}

export function findFlow(id: FlowLevel | undefined): FlowOption | undefined {
  return FLOW_LEVELS.find((f) => f.id === id);
}
