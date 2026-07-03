const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { regex: /clay-card/g, replace: 'premium-card' },
  { regex: /clay-btn-primary/g, replace: 'btn-ios-primary' },
  { regex: /clay-input/g, replace: 'input-ios' },
  { regex: /jelly-card/g, replace: 'transition-all duration-300 ease-fluid hover:-translate-y-1 hover:shadow-lg' },
  { regex: /jelly-btn/g, replace: 'transition-all duration-300 ease-fluid active:scale-95' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.replace);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log("Done");
