import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';  // <-- Change to this
console.log('Database script loaded');  // Test log

const dbPath = await invoke('get_db_path');
const db = await Database.load(`sqlite:${dbPath}`);

async function testDatabase() {
    try {
        const db = await Database.load('sqlite:all.db');
        console.log('Database connected successfully');

        // Example query: Adjust based on your all.db schema
        const result = await db.select('SELECT * FROM unit LIMIT 5');
        console.log('Query result:', result);

        // Example insert (if your schema allows)
        await db.execute(
            'INSERT OR IGNORE INTO treatments (Disease, ICD11) VALUES ($1, $2)',
            ['test_value1', 'test_value2']
        );
        console.log('Insert successful');

        // Verify insert
        const newResult = await db.select('SELECT * FROM treatments WHERE Disease = $1', ['test_value1']);
        console.log('Verification query result:', newResult);

        await db.close();
        console.log('Database closed');
    } catch (error) {
        console.error('Database error:', error);
    }
}
   
// Run the test
document.addEventListener('DOMContentLoaded', () => {
 //testDatabase();
});