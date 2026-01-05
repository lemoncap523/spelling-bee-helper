
import React from 'react';
import { WordInfo } from '../types';
import { playWordAudio } from '../services/geminiService';

interface WordDetailProps {
  info: WordInfo | null;
  isLoading: boolean;
  onClose: () => void;
}

const WordDetail: React.FC<WordDetailProps> = ({ info, isLoading, onClose }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full animate-bounce">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-purple-600">Finding information...</h2>
        </div>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all border-8 border-yellow-300">
        <div className="p-1 bg-yellow-300 flex justify-end">
          <button 
            onClick={onClose}
            className="text-yellow-800 hover:text-black font-bold p-2 text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-5xl font-black text-purple-700 capitalize">{info.word}</h2>
            <button 
              onClick={() => playWordAudio(info.word)}
              className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Listen to pronunciation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Definition</h3>
              <p className="text-xl text-gray-800 leading-relaxed font-medium">
                {info.definition}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-1">中文解釋</h3>
              <p className="text-2xl text-purple-900 font-bold">
                {info.chineseTranslation}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-2xl border-l-8 border-green-400">
              <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-1">Example</h3>
              <p className="text-xl italic text-green-800">
                "{info.exampleSentence}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transition-colors"
          >
            Got it! 👍
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordDetail;
