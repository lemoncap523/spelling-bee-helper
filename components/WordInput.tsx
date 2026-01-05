
import React, { useState } from 'react';

interface WordInputProps {
  onAddWords: (words: string[]) => void;
}

const WordInput: React.FC<WordInputProps> = ({ onAddWords }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // Split by comma, newline, or multiple spaces
    const words = text
      .split(/[\n,\s]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    onAddWords(words);
    setText('');
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-purple-200">
      <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center">
        <span className="mr-2">📝</span> Add Your Spelling Words
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full h-32 p-4 border-2 border-purple-100 rounded-2xl focus:border-purple-400 focus:ring-0 outline-none text-lg transition-all"
          placeholder="Type or paste words here (e.g., apple, banana, cherry)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="mt-4 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-2xl shadow-md transform transition active:scale-95 text-xl"
        >
          Add to List ✨
        </button>
      </form>
    </div>
  );
};

export default WordInput;
