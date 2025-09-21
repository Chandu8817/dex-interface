import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatEther } from 'ethers';
import { formatUSD } from '../../shared/utils/format';

interface TransactionStatusProps {
  transactionHash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string | null;
  message?: string;
  onDismiss?: () => void;
}

export const TransactionStatus = ({
  transactionHash,
  status,
  error,
  message,
  onDismiss,
}: TransactionStatusProps) => {
  const [toastId, setToastId] = useState<string | number | null>(null);

  useEffect(() => {
    if (status === 'pending' && !toastId) {
      const id = toast.loading(
        <div>
          <p className="font-medium">Transaction Pending</p>
          {transactionHash && (
            <a
              href={`https://etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Etherscan
            </a>
          )}
        </div>,
        {
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          draggable: false,
          isLoading: true,
        }
      );
      setToastId(id);
    } else if (status === 'success' && toastId) {
      toast.update(toastId, {
        render: (
          <div>
            <p className="font-medium">Transaction Successful</p>
            {message && <p className="text-sm mt-1">{message}</p>}
            {transactionHash && (
              <a
                href={`https://etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-sm block mt-1"
              >
                View on Etherscan
              </a>
            )}
          </div>
        ),
        type: 'success',
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
        closeOnClick: true,
        draggable: true,
      });
      setToastId(null);
    } else if (status === 'error' && toastId) {
      toast.update(toastId, {
        render: (
          <div>
            <p className="font-medium">Transaction Failed</p>
            <p className="text-sm mt-1">
              {error || 'An unknown error occurred. Please try again.'}
            </p>
          </div>
        ),
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
        closeOnClick: true,
        draggable: true,
      });
      setToastId(null);
    }
  }, [status, error, message, transactionHash, toastId]);

  // Clean up toast on unmount
  useEffect(() => {
    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [toastId]);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  );
};

export default TransactionStatus;
