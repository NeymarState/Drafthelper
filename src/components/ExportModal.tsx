import React, { useState } from 'react';
import { Player, DraftSettings } from '../types';
import { downloadDraftExcel, PYTHON_STREAMLIT_CODE } from '../utils/excelExport';
import { FileSpreadsheet, Code, Copy, Download, Check, X, Terminal } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  settings: DraftSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  players,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'excel' | 'python'>('excel');

  if (!isOpen) return null;

  const handleDownloadExcel = () => {
    downloadDraftExcel(players, settings);
  };

  const handleCopyPythonCode = () => {
    navigator.clipboard.writeText(PYTHON_STREAMLIT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPythonFile = () => {
    const element = document.createElement('a');
    const file = new Blob([PYTHON_STREAMLIT_CODE], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'app.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-700 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-xs text-slate-100 uppercase tracking-wider">EXCEL & PYTHON EXPORT CENTER</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-950/50 px-4 font-mono text-xs gap-1 pt-1">
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'excel'
                ? 'border-blue-500 text-white font-bold bg-blue-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 rounded-t'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXCEL ARBEITSMAPPE (.XLSX)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 py-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'border-blue-500 text-white font-bold bg-blue-500/10 rounded-t'
                : 'border-transparent text-slate-400 hover:text-slate-200 rounded-t'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>PYTHON / STREAMLIT (APP.PY)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans">
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg space-y-2">
                <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2 font-mono">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> EXCEL ARBEITSMAPPE (.XLSX) FEATURES:
                </h3>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Keine Makros / KEIN VBA:</strong> Vollständig kompatibel mit Excel 365, Google Sheets & OpenPyXL.</li>
                  <li><strong>Master Draft Board Sheet:</strong> Enthält dynamische Pick-Formeln <code className="text-blue-400 font-mono">Rd X (X.YY)</code> und VORP-Werte.</li>
                  <li><strong>Mein Team Sheet:</strong> Automatische Trennung Deiner gedrafteten Spieler.</li>
                  <li><strong>Positional Tiers Sheet:</strong> Übersicht aller Tiers mit OpenXML-konformer Formatierung.</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow cursor-pointer font-mono"
                >
                  <Download className="w-4 h-4" />
                  <span>EXCEL-DATEI HERUNTERLADEN (.XLSX)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>EXECUTE LOKAL: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-400 border border-slate-700">streamlit run app.py</code></span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={handleCopyPythonCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'KOPIERT!' : 'CODE KOPIEREN'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPythonFile}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>APP.PY SPEICHERN</span>
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 select-all">
                <pre>{PYTHON_STREAMLIT_CODE}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



