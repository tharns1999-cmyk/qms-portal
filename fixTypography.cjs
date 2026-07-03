const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const dirs = ['src/pages', 'src/components'];
let files = [];
dirs.forEach(d => {
  if (fs.existsSync(d)) files = files.concat(walkSync(d));
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Clean up previous regex mistake
  content = content.replace(/text-gray-\d+0 dark:text-white0 dark:text-white/g, 'text-gray-800 dark:text-white');
  content = content.replace(/dark:text-slate-300 dark:text-slate-400/g, 'dark:text-slate-400');
  content = content.replace(/text-gray-80 dark:text-white0/g, 'text-gray-800 dark:text-white');

  // Status colors (blue, red, emerald, green, amber)
  const replaceColor = (color) => {
    content = content.replace(new RegExp(`text-${color}-500(?!\\s+dark:text)`, 'g'), `text-${color}-500 dark:text-${color}-400`);
    content = content.replace(new RegExp(`text-${color}-600(?!\\s+dark:text)`, 'g'), `text-${color}-600 dark:text-${color}-400`);
    content = content.replace(new RegExp(`text-${color}-700(?!\\s+dark:text)`, 'g'), `text-${color}-700 dark:text-${color}-300`);
  };
  ['blue', 'red', 'emerald', 'green', 'amber', 'yellow', 'orange', 'purple', 'indigo'].forEach(replaceColor);

  // Global Typography Fallback
  content = content.replace(/text-gray-900(?!\s+dark:text)/g, 'text-gray-900 dark:text-slate-100');
  content = content.replace(/text-gray-800(?!\s+dark:text)/g, 'text-gray-800 dark:text-slate-100');
  content = content.replace(/text-slate-800(?!\s+dark:text)/g, 'text-slate-800 dark:text-slate-100');
  content = content.replace(/text-gray-700(?!\s+dark:text)/g, 'text-gray-700 dark:text-slate-300');
  content = content.replace(/text-gray-600(?!\s+dark:text)/g, 'text-gray-600 dark:text-slate-300');
  content = content.replace(/text-gray-500(?!\s+dark:text)/g, 'text-gray-500 dark:text-slate-400');
  content = content.replace(/text-gray-400(?!\s+dark:text)/g, 'text-gray-400 dark:text-slate-500');

  // Inputs
  content = content.replace(/<input\b[^>]*className="([^"]+)"[^>]*>/g, (match, classes) => {
    if (!classes.includes('dark:bg-slate-800') && !classes.includes('dark:bg-')) {
      let newClasses = classes;
      if (!newClasses.includes('dark:text-white')) newClasses += ' dark:text-white';
      if (!newClasses.includes('dark:placeholder-slate-400')) newClasses += ' dark:placeholder-slate-400';
      if (!newClasses.includes('dark:bg-slate-800/50')) newClasses += ' dark:bg-slate-800/50';
      if (!newClasses.includes('dark:border-slate-700')) newClasses += ' dark:border-slate-700';
      return match.replace(classes, newClasses);
    }
    return match;
  });

  if (file.includes('Dashboard.jsx')) {
    // Section Headers
    content = content.replace(/<h2([^>]*)ภาพรวมระบบ/g, (match, p1) => {
      let newP1 = p1.replace(/text-gray-[4-9]00/g, 'text-gray-800 dark:text-slate-100 font-semibold');
      return `<h2${newP1}ภาพรวมระบบ`;
    });
    
    content = content.replace(/<h2([^>]*)งานที่ต้องจัดการ/g, (match, p1) => {
      let newP1 = p1.replace(/text-gray-[4-9]00/g, 'text-gray-800 dark:text-slate-100 font-semibold');
      return `<h2${newP1}งานที่ต้องจัดการ`;
    });
    
    // Dates
    content = content.replace(/<p([^>]*)วันที่จำลองระบบ/g, (match, p1) => {
      let newP1 = p1.replace(/text-gray-[4-9]00/g, 'text-gray-500 dark:text-slate-400');
      return `<p${newP1}วันที่จำลองระบบ`;
    });
  }

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
