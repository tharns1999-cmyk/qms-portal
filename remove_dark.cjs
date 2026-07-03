const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Match `dark:` followed by any non-whitespace, non-quote characters
  const regex = /\bdark:[^\s"'\`]+/g;
  if (regex.test(content)) {
    // Replace the dark classes
    content = content.replace(regex, '');
    // Clean up multiple spaces that might have been left behind inside class strings
    // E.g., 'class1   class2' -> 'class1 class2'
    // But be careful not to mess up JSX spacing.
    // Instead of replacing all multiple spaces, we can just replace multiple spaces inside className strings, 
    // or just let the spaces be (HTML/React classNames ignore extra spaces).
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
console.log('Cleanup complete!');
