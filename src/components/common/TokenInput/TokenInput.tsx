import { useState } from 'react';
import type { Token } from '../../shared/types';
import TokenSelector from '../../TokenSelector';
import { formatUnits } from 'ethers';

interface TokenInputProps {
  value: string;
  onAmountChange: (value: string) => void;
  token: Token | null;
  onTokenSelect: (token: Token) => void;
  balance?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const TokenInput = ({
  value,
  onAmountChange,
  token,
  onTokenSelect,
  balance = '0',
  disabled = false,
  label,
  className = ''
}: TokenInputProps) => {
  const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);

  const handleMaxClick = () => {
    if (!token || !balance) return;
    onAmountChange(formatUnits(balance, token.decimals));
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-4 ${className}`}>
      {label && <div className="text-sm text-gray-400 mb-2">{label}</div>}
      <div className="flex items-center justify-between">
        <input
          type="number"
          className="bg-transparent text-2xl w-full outline-none text-white"
          placeholder="0.0"
          value={value}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setIsTokenSelectorOpen(true)}
          className="bg-gray-700 hover:bg-gray-600 rounded-xl px-4 py-2 flex items-center space-x-2 min-w-[120px] justify-center"
          disabled={disabled}
        >
          {token ? (
            <>
              <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
              <span>{token.symbol}</span>
            </>
          ) : (
            <span>Select token</span>
          )}
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>
          {token && balance
            ? `Balance: ${formatUnits(balance, token.decimals).substring(0, 10)}`
            : 'Balance: 0'}
        </span>
        <button
          type="button"
          onClick={handleMaxClick}
          className="text-blue-400 hover:text-blue-300"
          disabled={!balance || disabled}
        >
          Max
        </button>
      </div>

      <TokenSelector
        // isOpen={isTokenSelectorOpen as any}
        // onClose={() => setIsTokenSelectorOpen(false)}
        onSelect={onTokenSelect as any}
        selectedToken={token}
      />
    </div>
  );
};

export default TokenInput;
