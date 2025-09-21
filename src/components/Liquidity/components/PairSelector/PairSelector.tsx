import type { Token } from '../../../../types';
import { Button } from '../../../common/Button';
import { TokenSelector } from '../../../TokenSelector';
import { PlusIcon } from '../../../Icons';

interface PairSelectorProps {
  tokenA: Token | null;
  tokenB: Token | null;
  onTokenAChange: (token: Token) => void;
  onTokenBChange: (token: Token) => void;
  fee: number;
  onFeeChange: (fee: number) => void;
  onNext: () => void;
  disabled?: boolean;
}

export const PairSelector = ({
  tokenA,
  tokenB,
  onTokenAChange,
  onTokenBChange,
  fee,
  onFeeChange,
  onNext,
  disabled = false,
}: PairSelectorProps) => {
  // Token selection state is handled by the parent component

  const feeTiers = [
    { value: 500, label: '0.05%' },
    { value: 3000, label: '0.3%' },
    { value: 10000, label: '1%' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Select Pair</div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
          <TokenSelector
          selectedToken={tokenA}
          onSelect={onTokenAChange}
          excludeToken={tokenB}
          label="Select Token A"
        />
          </div>
          
          <div className="flex items-center justify-center w-10">
            <PlusIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex-1">
          <TokenSelector
          selectedToken={tokenB}
          onSelect={onTokenBChange}
          excludeToken={tokenA}
          label="Select Token B"
        />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Fee Tier</div>
          <div className="grid grid-cols-3 gap-2">
            {feeTiers.map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() => onFeeChange(tier.value)}
                className={`py-2 px-4 rounded-lg text-center ${
                  fee === tier.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                disabled={disabled}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <Button
        onClick={onNext}
        disabled={!tokenA || !tokenB || disabled}
        fullWidth
      >
        Next
      </Button>
      
     
      
   
    </div>
  );
};
