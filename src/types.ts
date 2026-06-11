export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  audioUrl?: string;
  isAudio?: boolean;
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  domain: "materials" | "energy";
  keywords: string[];
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export type AccentColor = "navy" | "teal" | "emerald" | "violet" | "crimson";

export interface AppTheme {
  mode: "light" | "dark" | "auto";
  accent: AccentColor;
}

export interface CitationFormat {
  apa: string;
  chicago: string;
  bibtex: string;
  ris: string;
}
