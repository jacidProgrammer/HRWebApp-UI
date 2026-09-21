import type { Sentiment } from '../api/types';

const POSITIVE = /\b(thank|thanks|great|amazing|awesome|love|loved|brilliant|excellent|helpful|impressive|fantastic|kind|clear|calm|generous|saved|proud|well done|gracias|genial|danke|super|toll)\b/i;
const NEGATIVE = /\b(late|slow|rude|missing|missed|confusing|frustrat\w*|poor|bad|slipped|rushed|ignored|problem|unclear|never)\b/i;

/** Stand-in for the backend's Hugging Face model in demo mode: a keyword heuristic, clearly not AI. */
export function fakeSentiment(message: string): Sentiment {
  const positive = (message.match(new RegExp(POSITIVE, 'gi')) ?? []).length;
  const negative = (message.match(new RegExp(NEGATIVE, 'gi')) ?? []).length;
  if (positive > negative) return { label: 'POSITIVE', score: Math.min(0.99, 0.84 + positive * 0.04) };
  if (negative > positive) return { label: 'NEGATIVE', score: Math.min(0.97, 0.72 + negative * 0.06) };
  return { label: 'NEUTRAL', score: 0.63 };
}
