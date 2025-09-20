import { useState, useEffect } from 'react';
import ToggleButton from './UI/ToggleButton';

interface SlippageSettingsProps {
  slippage: number;
  onSlippageChange: (value: number) => void;
  deadline: number;
  onDeadlineChange: (value: number) => void;
  className?: string;
  isMulitiCallOn?: boolean;
  setIsMulitiCallOn?: (value: boolean) => void;
}

export const SlippageSettings = ({
  slippage,
  onSlippageChange,
  deadline,
  onDeadlineChange,
  className = '',
  isMulitiCallOn=false,
  setIsMulitiCallOn = () => {},
}: SlippageSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState(slippage.toString());
  const [customDeadline, setCustomDeadline] = useState(deadline);
  const [activePreset, setActivePreset] = useState<string | null>(null);


  const presets = [
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1%', value: 1 },
  ];

 

  useEffect(() => {
    // Update custom slippage when it changes from parent
    setCustomSlippage(slippage.toString());
    
    // Check if current slippage matches any preset
    const matchingPreset = presets.find(preset => 
      Math.abs(preset.value - slippage) < 0.01
    );
    setActivePreset(matchingPreset ? matchingPreset.label : null);
  }, [slippage]);

  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, decimal numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomSlippage(value);
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onSlippageChange(numValue);
      }
    }
  };

  const handleCustomDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomDeadline(parseInt(value));
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        onDeadlineChange(numValue);
      }
    }
  };

  const handlePresetSelect = (value: number) => {
    setCustomSlippage(value.toString());
    onSlippageChange(value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(customSlippage);
    if (isNaN(numValue) || numValue <= 0) {
      setCustomSlippage('0.5');
      onSlippageChange(0.5);
    } else if (numValue > 50) {
      setCustomSlippage('50');
      onSlippageChange(50);
    } else {
      // Round to 2 decimal places
      const rounded = Math.round(numValue * 100) / 100;
      setCustomSlippage(rounded.toString());
      if (rounded !== numValue) {
        onSlippageChange(rounded);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Slippage settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Slippage tolerance
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex space-x-2 mb-3">
            {presets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetSelect(preset.value)}
                className={`flex-1 py-2 px-3 text-sm rounded-md ${
                  activePreset === preset.label
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={customSlippage}
              onChange={handleCustomSlippageChange}
              onBlur={handleBlur}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.5"
              inputMode="decimal"
              aria-label="Custom slippage tolerance"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 text-sm">%</span>
            </div>
          </div>

          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {slippage < 0.5
              ? 'Your transaction may fail'
              : slippage > 5
              ? 'Your transaction may be frontrun'
              : 'Your transaction may be frontrun if price moves unfavorably by more than this percentage'}
          </p>
          
          <div className="relative">
            <input
              type="text"
              value={customDeadline || ""}
              onChange={handleCustomDeadlineChange}
              onBlur={handleBlur}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15"
              inputMode="decimal"
              aria-label="Custom deadline"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 text-sm">min</span>
            </div>

          </div>

          <div>
          <ToggleButton enabled={isMulitiCallOn} onChange={setIsMulitiCallOn} />

            </div>
          
         
        </div>
      )}
    </div>
  );
};
