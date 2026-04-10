const { Client } = require('pg');

const passwords = ["", "postgres", "root", "1234", "123456", "admin", "techempresa"];

async function tryConnect() {
    for (let pwd of passwords) {
        const client = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: pwd,
            port: 5432,
        });
        
        try {
            await client.connect();
            console.log(`PASSWORD_FOUND: ${pwd}`);
            await client.end();
            return;
        } catch (err) {
            // console.error(err);
        }
    }
    console.log("NO_PASSWORD_FOUND");
}

tryConnect();
