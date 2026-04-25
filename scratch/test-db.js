const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../loanLink-server/.env' });

const uri = `mongodb+srv://${process.env.URI_USER_NAME}:${process.env.URI_PASSWORD}@cluster0.sillvi5.mongodb.net/?appName=Cluster0`;

console.log('Testing connection to:', uri.replace(process.env.URI_PASSWORD, '****'));

async function test() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true,
        },
    });
    try {
        await client.connect();
        console.log('Connected successfully');
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged successfully');
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await client.close();
    }
}

test();
