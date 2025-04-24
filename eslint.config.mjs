// @ts-check

/**
 * @link https://typescript-eslint.io/getting-started/
 * ```
 * pnpm add -D eslint @eslint/js typescript typescript-eslint
 * ```
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/',
            '**/dist/',
            '**/*.js',
        ]
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    [
        {
            rules: {
                'no-shadow': 'error',
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-unsafe-function-type': 'off',
            }
        }
    ]
);
