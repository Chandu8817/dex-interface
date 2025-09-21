import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const TransactionStatus = ({
  transactionHash,
  status,
  error,
  message,
}: {
  transactionHash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string | null;
  message?: string;
}) => {
  // Show toast notifications based on status
  useEffect(() => {
    if (status === 'pending') {
      toast.info(
        <div>
          <p>Transaction pending...</p>
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
        </div>,
        { autoClose: false }
      );
    } else if (status === 'success') {
      toast.success(
        <div>
          <p>{message || 'Transaction successful!'}</p>
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
      );
    } else if (status === 'error') {
      toast.error(error || 'Transaction failed');
    }
  }, [status, error, message, transactionHash]);
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
