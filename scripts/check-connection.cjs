require('@next/env').loadEnvConfig(process.cwd());
const {Client}=require('pg');
const url=new URL(process.env.DATABASE_URL);
console.log(JSON.stringify({host:url.hostname,port:url.port,projectUser:decodeURIComponent(url.username)}));
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
(async()=>{try{await db.connect();const result=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");console.log(JSON.stringify({connected:true,tables:result.rows.map(row=>row.tablename)}));}catch(e){console.error(JSON.stringify({connected:false,code:e.code}));process.exitCode=1;}finally{await db.end();}})();
