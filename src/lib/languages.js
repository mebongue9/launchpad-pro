// /src/lib/languages.js
// Language constants for multi-language content generation
// RELEVANT FILES: src/components/common/LanguageSelector.jsx, src/pages/Settings.jsx

// Full list of supported languages (alphabetical)
export const ALL_LANGUAGES = [
  'Arabic',
  'Bengali',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Norwegian',
  'Polish',
  'Portuguese (Brazil)',
  'Portuguese (Portugal)',
  'Romanian',
  'Russian',
  'Spanish',
  'Swedish',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Vietnamese'
];

// Default favorite languages (shown at top of selector)
export const DEFAULT_FAVORITE_LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'Indonesian',
  'German'
];

// Get language display name (for UI)
export function getLanguageDisplayName(code) {
  return code;
}

// Language suffix to append to all AI prompts
export function getLanguagePromptSuffix(language) {
  if (!language || language === 'English') {
    return '';
  }

  return `
---
OUTPUT LANGUAGE: ${language}
All content must be written entirely in ${language}.
Do not include any English unless the user's language is English.
`;
}
