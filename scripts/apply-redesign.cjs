require('@next/env').loadEnvConfig(process.cwd());
const {Client}=require('pg');const fs=require('node:fs');
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
(async()=>{try{await db.connect();await db.query(fs.readFileSync('prisma/dashboard-redesign.sql','utf8'));console.log('Redesign tables ready. Existing records unchanged.');}catch(e){console.error(JSON.stringify({error:'Redesign setup failed',code:e.code}));process.exitCode=1;}finally{await db.end();}})();
