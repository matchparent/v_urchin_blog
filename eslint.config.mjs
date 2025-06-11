import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier'; // Prettier 插件
import prettierRecommended from 'eslint-plugin-prettier/recommended'; // 推荐配置

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 忽略规则
  {
    ignores: [
      'src/generated/**/*',
      '**/*.scss',
      '**/*.css',
      '**/*.module.css',
      '**/*.module.scss',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettierRecommended,
  // 可选：手动开启 prettier/prettier 规则（如需覆盖默认推荐项）
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error'],
      // destructuring stop alert unused
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default eslintConfig;
