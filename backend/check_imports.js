const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') && !file.includes('test') && !file.includes('migration') && !file.includes('seeder')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let errors = 0;
files.forEach(f => {
  try { 
    require(f); 
  } catch (e) { 
    if(e.code === 'MODULE_NOT_FOUND') {
      console.error("Error in " + f + ": " + e.message); 
      errors++;
    }
  }
});
console.log('Done. Found ' + errors + ' MODULE_NOT_FOUND errors.');
