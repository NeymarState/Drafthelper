import React, { useState, useEffect } from 'react';
import { StickyNote, ChevronRight, ChevronLeft } from 'lucide-react';

export const NotesSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('ff_command_center_notes_2026') || '';
  });

  useEffect(() => {
    localStorage.setItem('ff_command_center_notes_2026', notes);
  }, [notes]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-[60] bg-yellow-500 hover:bg-yellow-400 text-slate-900 p-2 rounded-l-lg shadow-lg shadow-yellow-500/20 transition-all duration-300 flex items-center justify-center cursor-pointer ${
          isOpen ? 'right-80' : 'right-0'
        }`}
        style={{ width: '40px', height: '48px' }}
        title="Draft Notizen"
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-[55] transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-700 bg-slate-950 flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-yellow-500" />
          <h2 className="font-bold text-slate-100 uppercase tracking-wider text-sm">Draft Notizen</h2>
        </div>
        
        <div className="flex-1 p-4 bg-slate-900/50">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hier kannst du dir Notizen für den Draft machen (z.B. Targets für die nächsten Runden, Erinnerungen...)"
            className="w-full h-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 resize-none custom-scrollbar"
          />
        </div>
      </div>
    </>
  );
};
