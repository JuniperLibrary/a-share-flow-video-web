import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { getQueryClient } from './lib/get-query-client';
import HomePage from './FundPage';
import './fund.css';

const queryClient = getQueryClient();

export default function FundTab() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'sonner-toast',
          duration: 3000,
        }}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
