const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const outputFile = path.join(__dirname, 'supabase', 'full_setup.sql');

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
let combinedSql = '';

for (const file of files) {
    combinedSql += `-- Migration: ${file}\n\n`;
    combinedSql += fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    combinedSql += '\n\n';
}

fs.writeFileSync(outputFile, combinedSql);
console.log('Combined SQL written to ' + outputFile);
