/**
 * Script to generate a TypeORM migration file.
 * Usage using ts-node: ts-node [root]/src/scripts/generate-migration.script.ts <migration-name>
 * Usage using npm script: npm run generate-migration <migration-name>
 */
const { execSync } = require('child_process');
const migrationName = process.argv[2];

if (!migrationName) {
    console.error('Error: Migration name is required');
    process.exit(1);
}

try {
    execSync(
        `npm run typeorm migration:generate ./src/migrations/${migrationName} -- -d src/configs/database.config.ts`,
        { stdio: 'inherit' }
    );
} catch (error) {
    console.error('Migration generation failed:', error.message);
    process.exit(1);
}