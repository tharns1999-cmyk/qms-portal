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

  // Global Typography Fallback
  content = content.replace(/text-gray-900(?!\s+dark:text)/g, 'text-gray-900 dark:text-slate-100');
  content = content.replace(/text-gray-800(?!\s+dark:text)/g, 'text-gray-800 dark:text-slate-100');
  content = content.replace(/text-slate-800(?!\s+dark:text)/g, 'text-slate-800 dark:text-slate-100');

  content = content.replace(/text-gray-700(?!\s+dark:text)/g, 'text-gray-700 dark:text-slate-300');
  content = content.replace(/text-gray-600(?!\s+dark:text)/g, 'text-gray-600 dark:text-slate-300');
  content = content.replace(/text-gray-500(?!\s+dark:text)/g, 'text-gray-500 dark:text-slate-400');
  content = content.replace(/text-gray-400(?!\s+dark:text)/g, 'text-gray-400 dark:text-slate-500');

  // Status colors (blue, red, emerald, green, amber)
  content = content.replace(/text-blue-500(?!\s+dark:text)/g, 'text-blue-500 dark:text-blue-400');
  content = content.replace(/text-blue-600(?!\s+dark:text)/g, 'text-blue-600 dark:text-blue-400');
  content = content.replace(/text-red-500(?!\s+dark:text)/g, 'text-red-500 dark:text-red-400');
  content = content.replace(/text-red-600(?!\s+dark:text)/g, 'text-red-600 dark:text-red-400');
  content = content.replace(/text-emerald-500(?!\s+dark:text)/g, 'text-emerald-500 dark:text-emerald-400');
  content = content.replace(/text-emerald-600(?!\s+dark:text)/g, 'text-emerald-600 dark:text-emerald-400');
  content = content.replace(/text-green-500(?!\s+dark:text)/g, 'text-green-500 dark:text-green-400');
  content = content.replace(/text-green-600(?!\s+dark:text)/g, 'text-green-600 dark:text-green-400');
  content = content.replace(/text-amber-500(?!\s+dark:text)/g, 'text-amber-500 dark:text-amber-400');
  content = content.replace(/text-amber-600(?!\s+dark:text)/g, 'text-amber-600 dark:text-amber-400');

  // Dashboard & Status Cards Fix
  if (file.includes('Dashboard.jsx')) {
    // Numbers (like text-3xl font-bold)
    content = content.replace(/text-3xl\s+font-bold\s+text-gray-\d+0(?!\s+dark:text-white)/g, match => match + ' dark:text-white');

    // Fix Dashboard Box Titles (Draft, In Progress, etc)
    content = content.replace(/text-sm\s+font-medium\s+text-gray-600(?!\s+dark:text-slate-300)/g, match => match + ' dark:text-slate-300');
    content = content.replace(/text-sm\s+font-medium\s+text-gray-500(?!\s+dark:text-slate-300)/g, match => match + ' dark:text-slate-300');

    // Section Headers
    content = content.replace(/ภาพรวมระบบ\s*\(System Overview\)/g, match => match); // We just need to add classes to its wrapper
    content = content.replace(/<h2([^>]*)ภาพรวมระบบ/g, (match, p1) => {
      if (!p1.includes('dark:text-slate-100')) {
        return `<h2${p1.replace(/text-gray-\d+0/, 'text-gray-800 dark:text-slate-100 font-semibold')}ภาพรวมระบบ`;
      }
      return match;
    });

    content = content.replace(/<h2([^>]*)'การจัดการงานที่ต้องการ'/g, (match, p1) => {
      if (!p1.includes('dark:text-slate-100')) {
        return `<h2${p1.replace(/text-gray-\d+0/, 'text-gray-800 dark:text-slate-100 font-semibold')}งานที่ต้องจัดการ`;
      }
      return match;
    });

    // Date
    content = content.replace(/<span([^>]*)จำลองวันที่/g, (match, p1) => {
      if (!p1.includes('dark:text-slate-400')) {
        return `<span${p1.replace(/text-gray-\d+0/, 'text-gray-500 dark:text-slate-400')}จำลองวันที่`;
      }
      return match;
    });
  }

  // Inputs
  // Find <input ... className="... text-gray-700 ..." />
  content = content.replace(/<input\b[^>]*className="([^"]+)"[^>]*>/g, (match, classes) => {
    if (!classes.includes('dark:bg-slate-800')) {
      let newClasses = classes;
      if (!newClasses.includes('dark:text-white')) newClasses += ' dark:text-white';
      if (!newClasses.includes('dark:placeholder-slate-400')) newClasses += ' dark:placeholder-slate-400';
      if (!newClasses.includes('dark:bg-slate-800/50')) newClasses += ' dark:bg-slate-800/50';
      if (!newClasses.includes('dark:border-slate-700')) newClasses += ' dark:border-slate-700';

      return match.replace(classes, newClasses);
    }
    return match;
  });

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});