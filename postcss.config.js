import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import scopeFundCss from './scripts/postcss-scope-fund.mjs';

export default {
  // 顺序有意义：tailwind 先展开 `@tailwind` / 生成工具类，再给基金页样式
  // 加 `.fund-app` 作用域（见 scripts/postcss-scope-fund.mjs），最后补前缀。
  plugins: [tailwindcss(), scopeFundCss(), autoprefixer()],
};
