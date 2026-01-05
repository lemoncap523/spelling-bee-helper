
import React, { useReducer, useEffect, useState } from 'react';
import { WordInfo, AppState } from './types';
import WordInput from './components/WordInput';
import WordDetail from './components/WordDetail';
import FileUploader from './components/FileUploader';
import { fetchWordInfo } from './services/geminiService';

const STORAGE_KEY_WORDS = 'spelling_bee_words_v2';
const STORAGE_KEY_DETAILS = 'spelling_bee_details_v2';

type Action =
  | { type: 'LOAD_ALL'; payload: { list: string[]; details: Record<string, WordInfo> } }
  | { type: 'ADD_WORDS'; payload: string[] }
  | { type: 'REMOVE_WORD'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_DETAILS'; payload: { word: string; info: WordInfo } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  wordList: [],
  selectedWord: null,
  wordDetails: {},
  loading: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_ALL':
      return { ...state, wordList: action.payload.list, wordDetails: action.payload.details };
    case 'ADD_WORDS': {
      const newWords = action.payload.map(w => w.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")).filter(Boolean);
      const uniqueWords = Array.from(new Set([...state.wordList, ...newWords]));
      return { ...state, wordList: uniqueWords };
    }
    case 'REMOVE_WORD':
      return {
        ...state,
        wordList: state.wordList.filter(w => w !== action.payload),
        selectedWord: state.selectedWord === action.payload ? null : state.selectedWord,
      };
    case 'CLEAR_ALL':
      return { ...initialState };
    case 'SET_SELECTED':
      return { ...state, selectedWord: action.payload };
    case 'SET_DETAILS':
      return {
        ...state,
        wordDetails: { ...state.wordDetails, [action.payload.word]: action.payload.info },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Load from Storage on mount
  useEffect(() => {
    const savedWords = localStorage.getItem(STORAGE_KEY_WORDS);
    const savedDetails = localStorage.getItem(STORAGE_KEY_DETAILS);

    const list = savedWords ? JSON.parse(savedWords) : [];
    const details = savedDetails ? JSON.parse(savedDetails) : {};

    dispatch({ type: 'LOAD_ALL', payload: { list, details } });
  }, []);

  // Save to Storage whenever list or details change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(state.wordList));
    localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(state.wordDetails));
  }, [state.wordList, state.wordDetails]);

  const handleWordClick = async (word: string) => {
    // Check Cache first (Instant load)
    if (state.wordDetails[word]) {
      dispatch({ type: 'SET_SELECTED', payload: word });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const info = await fetchWordInfo(word);

      if (info.notFound) {
        dispatch({ type: 'SET_ERROR', payload: `No results for "${word}". Is it a real word? 🤔` });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({ type: 'SET_DETAILS', payload: { word, info } });
      dispatch({ type: 'SET_SELECTED', payload: word });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err: unknown) {
      console.error(err);
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = err instanceof Error ? err.message : 'Unknown error';
      const msg = message === 'TIMEOUT'
        ? "Took too long! Try again? ⏳"
        : "Something went wrong! Check your internet!";
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  };

  const handleClearEverything = () => {
    if (window.confirm("Delete ALL words and saved definitions? 🗑️")) {
      dispatch({ type: 'CLEAR_ALL' });
      localStorage.removeItem(STORAGE_KEY_WORDS);
      localStorage.removeItem(STORAGE_KEY_DETAILS);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-purple-50/30">
      <header className="bg-gradient-to-r from-purple-500 via-pink-400 to-yellow-300 py-10 px-4 text-center shadow-md mb-8">
        <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-2">
          🐝 Spelling Bee Buddy
        </h1>
        <p className="text-white text-xl font-medium opacity-90">
          Learn, Pronounce, and Master Your Words!
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-8">
        {state.error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-3xl relative animate-bounce flex items-center justify-between shadow-sm" role="alert">
            <span className="font-bold text-lg">⚠️ {state.error}</span>
            <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="text-3xl font-bold ml-4 hover:scale-110 transition-transform">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <WordInput onAddWords={(words) => dispatch({ type: 'ADD_WORDS', payload: words })} />
          <FileUploader onWordsExtracted={(words) => dispatch({ type: 'ADD_WORDS', payload: words })} onProcessing={setIsProcessingFile} />
        </div>

        {isProcessingFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-[100] text-white p-6 text-center">
            <div className="text-8xl animate-pulse mb-6">📄</div>
            <h2 className="text-4xl font-black mb-4">Reading your file...</h2>
            <p className="text-xl opacity-90 max-w-md">Finding your words instantly...</p>
          </div>
        )}

        <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-blue-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b-2 border-blue-50 pb-6">
            <h2 className="text-3xl font-black text-blue-600 flex items-center">
              <span className="mr-3">📚</span> My Word List
              <span className="ml-3 bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xl">{state.wordList.length}</span>
            </h2>
            {state.wordList.length > 0 && (
              <button
                onClick={handleClearEverything}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl text-xl font-black transition-all active:scale-90 flex items-center gap-2 shadow-lg shadow-red-200"
              >
                <span>🗑️</span> Clear Everything
              </button>
            )}
          </div>

          {state.wordList.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 italic text-2xl">
              Your list is empty. Add words or upload a PDF above! 🚀
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {state.wordList.map((word) => (
                <div key={word} className="group relative">
                  <button
                    onClick={() => handleWordClick(word)}
                    className="w-full bg-blue-50/50 hover:bg-blue-500 hover:text-white text-blue-700 font-bold py-5 px-4 rounded-3xl border-2 border-blue-100 shadow-sm transition-all transform hover:-translate-y-1 active:scale-95 text-xl capitalize overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {word}
                    {state.wordDetails[word] && <span className="absolute top-2 left-2 text-xs">⭐</span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'REMOVE_WORD', payload: word });
                    }}
                    className="absolute -top-3 -right-3 bg-red-400 hover:bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10 border-4 border-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <WordDetail
        info={state.selectedWord ? state.wordDetails[state.selectedWord] : null}
        isLoading={state.loading}
        onClose={() => dispatch({ type: 'SET_SELECTED', payload: null })}
      />

      <footer className="mt-16 text-center text-gray-300 font-medium text-sm">
        Built with ❤️ for Spelling Bee Champions
      </footer>
    </div>
  );
};

export default App;
