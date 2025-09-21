import type { Token } from '../../../../shared/types';
import { TokenInput } from '../../../common/TokenInput/TokenInput';
import { Button } from '../../../common/Button/Button';


export interface AddLiquidityFormProps {
  tokenA: Token | null;
  tokenB: Token | null;
  amountA: string;
  amountB: string;
  onAmountAChange: (value: string) => void;
  onAmountBChange: (value: string) => void;
  onSwitchTokens: () => void;
  onAddLiquidity: () => Promise<void>;
  onBack: () => void;
  slippage: number;
  onSlippageChange: (value: number) => void;
  deadline: number;
  onDeadlineChange: (value: number) => void;
  isLoading: boolean;
  tokenABalance?: string;
  tokenBBalance?: string;
}

export const AddLiquidityForm = ({
  tokenA,
  tokenB,
  amountA,
  amountB,
  onAmountAChange,
  onAmountBChange,
  onSwitchTokens,
  onAddLiquidity,
  onBack,
  slippage,
  onSlippageChange,
  deadline,
  onDeadlineChange,
  isLoading,
  tokenABalance = '0',
  tokenBBalance = '0',
}: AddLiquidityFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Add Liquidity</h3>
        <button
          type="button"
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 text-sm"
          disabled={isLoading}
        >
          ← Back
        </button>
      </div>
      
      <div className="space-y-4">
        <TokenInput
          value={amountA}
          onAmountChange={onAmountAChange}
          token={tokenA}
          onTokenSelect={() => {}} // Handled in parent
          balance={tokenABalance}
          label="Input"
          disabled={isLoading}
        />
        
        <div className="flex justify-center -my-2">
          <button
            type="button"
            onClick={onSwitchTokens}
            className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M15.707 4.293a1 1 0 010 1.414L10.414 11H18a1 1 0 110 2h-7.586l5.293 5.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        
        <TokenInput
          value={amountB}
          onAmountChange={onAmountBChange}
          token={tokenB}
          onTokenSelect={() => {}} // Handled in parent
          balance={tokenBBalance}
          label="Output"
          disabled={isLoading}
        />
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Slippage tolerance</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              className="w-20 bg-gray-700 rounded-lg px-3 py-1.5 text-right"
              value={slippage}
              onChange={(e) => onSlippageChange(Number(e.target.value))}
              step="0.1"
              min="0.1"
              max="50"
              disabled={isLoading}
            />
            <span>%</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Transaction deadline</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              className="w-20 bg-gray-700 rounded-lg px-3 py-1.5 text-right"
              value={deadline}
              onChange={(e) => onDeadlineChange(Number(e.target.value))}
              min="1"
              max="30"
              disabled={isLoading}
            />
            <span>minutes</span>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onAddLiquidity}
        disabled={!tokenA || !tokenB || !amountA || !amountB || isLoading}
        variant="primary"
        fullWidth
        isLoading={isLoading}
      >
        Add Liquidity
      </Button>
    </div>
  );
};

export default AddLiquidityForm;
