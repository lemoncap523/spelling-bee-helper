
export interface WordInfo {
  word: string;
  definition: string;
  chineseTranslation: string;
  exampleSentence: string;
}

export interface AppState {
  wordList: string[];
  selectedWord: string | null;
  wordDetails: Record<string, WordInfo>;
  loading: boolean;
  error: string | null;
}
