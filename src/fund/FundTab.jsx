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
      {/* fund.css 是整站搬过来的样式表，构建期由 scripts/postcss-scope-fund.mjs
          统一加上 `.fund-app` 作用域；这里提供作用域根节点。display:contents
          不产生布局盒，基金页原有尺寸不受影响。 */}
      <div className="fund-app" style={{ display: 'contents' }}>
        <HomePage />
      </div>
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
