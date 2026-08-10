const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/CrustMatrixGlobe.tsx',
  'src/components/DeepStrataScan.tsx',
  'src/components/MantleMindChat.tsx',
  'src/components/SurveyFeed.tsx'
];

const replacements = [
  [/stone-950/g, 'earth-950'],
  [/stone-900/g, 'earth-900'],
  [/stone-850/g, 'earth-850'],
  [/stone-800/g, 'earth-800'],
  [/stone-700/g, 'earth-700'],
  [/stone-600/g, 'earth-500'],
  [/stone-500/g, 'earth-400'],
  [/stone-400/g, 'earth-300'],
  [/stone-300/g, 'earth-200'],
  [/stone-200/g, 'earth-100'],
  [/stone-100/g, 'sand-100'],
  
  [/amber-950/g, 'terra-950'],
  [/amber-900/g, 'terra-900'],
  [/amber-850/g, 'terra-850'],
  [/amber-800/g, 'terra-800'],
  [/amber-700/g, 'terra-700'],
  [/amber-650/g, 'terra-600'],
  [/amber-600/g, 'terra-600'],
  [/amber-500/g, 'sand-500'],
  [/amber-400/g, 'sand-400'],
  [/amber-300/g, 'sand-300'],
  
  [/orange-950/g, 'terra-950'],
  [/orange-900/g, 'terra-900'],
  [/orange-850/g, 'terra-850'],
  [/orange-800/g, 'terra-800'],
  [/orange-700/g, 'terra-700'],
  [/orange-600/g, 'terra-600'],
  [/orange-500/g, 'terra-500'],
  [/orange-400/g, 'terra-400'],
  [/orange-300/g, 'terra-300'],

  [/emerald-950/g, 'moss-950'],
  [/emerald-900/g, 'moss-900'],
  [/emerald-800/g, 'moss-800'],
  [/emerald-700/g, 'moss-700'],
  [/emerald-600/g, 'moss-600'],
  [/emerald-500/g, 'moss-500'],
  [/emerald-400/g, 'moss-400'],
  [/emerald-300/g, 'moss-300'],
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  fs.writeFileSync(file, content);
});
console.log('Colors replaced successfully.');
