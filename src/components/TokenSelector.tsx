import { useState, useMemo } from 'react';
import type { Token } from '../types';
import { useTokens } from '../hooks/useTokens';

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  label?: string;
  className?: string;
}

export function TokenSelector({ 
  selectedToken, 
  onSelect, 
  excludeToken = null,
  label = 'Select Token',
  className = '' 
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { tokens, isLoading } = useTokens();
  
  // Filter out the excluded token and apply search filter
  const filteredTokens = useMemo(() => {
    // First filter out the excluded token if provided
    let result = tokens;
    
    if (excludeToken) {
      result = result.filter(
        token => token.address.toLowerCase() !== excludeToken.address.toLowerCase()
      );
    }
    
    // Then apply search filter if search term exists
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        token =>
          token.name.toLowerCase().includes(searchLower) ||
          token.symbol.toLowerCase().includes(searchLower) ||
          token.address.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [tokens, excludeToken, searchTerm]);
  
  const handleTokenSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setSearchTerm('');
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          isOpen ? 'ring-2 ring-blue-500' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedToken ? `Selected token: ${selectedToken.symbol}` : 'Select token'}
      >
        <div className="flex items-center space-x-2">
          {selectedToken ? (
            <>
              <img 
                src={selectedToken.logoURI} 
                alt={selectedToken.symbol} 
                className="w-6 h-6 rounded-full" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
                }}
              />
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedToken.symbol}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Token list"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search token name or paste address"
              className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              aria-label="Search tokens"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading tokens...
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No matching tokens found' : 'No tokens available'}
              </div>
            ) : (
              <ul>
                {filteredTokens.map((token) => (
                  <li key={token.address} role="option" aria-selected={selectedToken?.address === token.address}>
                    <button
                      type="button"
                      className="w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      onClick={() => handleTokenSelect(token)}
                    >
                      <img 
                        src={token.logoURI} 
                        alt="" 
                        className="w-6 h-6 rounded-full mr-3 flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/24';
                        }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {token.name}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
};

export default TokenSelector;
