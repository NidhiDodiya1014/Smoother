const fs = require('fs');
const files = [
  'c:/Users/nidhi/OneDrive/Desktop/tmp/Smoother/Smoother/client/src/pages/home.jsx',
  'c:/Users/nidhi/OneDrive/Desktop/tmp/Smoother/Smoother/client/src/pages/addSong.jsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/color:\s*['"]#fff['"]/g, 'color: "var(--text-primary)"');
  content = content.replace(/color:\s*['"]#ffffff['"]/g, 'color: "var(--text-primary)"');
  
  // also fix black/dark backgrounds that should be var(--glass-bg-hover) or something?
  // the mask color #15151a is a dark color. For now it's okay.
  fs.writeFileSync(f, content);
});
