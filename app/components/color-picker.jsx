import { useState, useRef, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';

export default function ColorPicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const swatches = [
    '#f97316', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#14b8a6', // Teal
  ];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/40 last:border-b-0">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      
      <div className="relative" ref={popoverRef}>
        {/* Toggle Trigger */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ backgroundColor: value }}
            className="h-6 w-6 rounded-full border border-slate-800 shadow-inner hover:scale-105 active:scale-95 transition-transform"
            aria-label={`Pick ${label} color`}
          />
        </div>

        {/* Popover */}
        {isOpen && (
          <div className="absolute right-0 mt-2.5 w-60 rounded-xl border border-slate-800 bg-[#0F1524] text-white shadow-2xl p-4 z-50 animate-slide-up origin-top-right">
            {/* Color preview & native picker */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute inset-[-10px] h-20 w-20 cursor-pointer p-0 border-none"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                  Pick Custom Color
                </span>
                <span className="text-xs font-bold font-mono text-slate-200 block truncate">{value}</span>
              </div>
            </div>

            {/* Swatches Grid */}
            <div className="mb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Preset Colors
              </span>
              <div className="grid grid-cols-4 gap-2">
                {swatches.map((color) => (
                  <button
                    key={color}
                    onClick={() => onChange(color)}
                    style={{ backgroundColor: color }}
                    className={`h-7 w-full rounded-md border transition-all relative ${
                      value === color ? 'border-white scale-105 shadow' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {value === color && (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Copy Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={copyToClipboard}
                title="Copy color hex"
                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
