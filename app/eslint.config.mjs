import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactNative from 'eslint-plugin-react-native';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'react': pluginReact,
            'react-native': pluginReactNative,
        },
        rules: {
            indent: ['error', 4],
            'no-multi-spaces': ['error'],
            'no-trailing-spaces': ['error'],
            'no-tabs': ['error'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
            'eol-last': ['error'],

            'object-curly-spacing': ['error', 'always'],
            'object-curly-newline': ['error', { multiline: true }],

            'array-bracket-spacing': ['error', 'never'],
            'array-bracket-newline': ['error', { multiline: true }],

            'block-spacing': ['error'],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],

            'arrow-spacing': ['error'],
            'arrow-parens': ['error', 'as-needed'],

            quotes: ['error', 'single', { avoidEscape: true }],
            'jsx-quotes': ['error', 'prefer-double'],

            'semi-spacing': ['error'],
            semi: ['error', 'always'],

            'comma-spacing': ['error'],
            'comma-style': ['error'],
            'comma-dangle': ['error', 'always-multiline'],

            'rest-spread-spacing': ['error'],

            'react/self-closing-comp': 'error',
            'react/jsx-boolean-value': ['error', 'never'],
            'react/jsx-curly-spacing': ['error', { when: 'never', children: true }],
        },
    },
]);
