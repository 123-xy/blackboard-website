require('@next/env').loadEnvConfig(process.cwd());
const { Client } = require('pg');
const fs = require('node:fs');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
(async()=>{
  try {
    await db.connect();
    const before = await db.query('SELECT (SELECT count(*) FROM "Inquiry")::int AS enquiries, (SELECT count(*) FROM "Reservation")::int AS bookings');
    await db.query(fs.readFileSync('prisma/dashboard-upgrade.sql','utf8'));
    const email='admin@blackboardrestaurant.com';
    const existing=await db.query('SELECT id FROM "AdminUser" WHERE email=$1',[email]);
    if(!existing.rowCount){
      const password=crypto.randomBytes(18).toString('base64url');
      await db.query('INSERT INTO "AdminUser" (id,email,"passwordHash",name,role,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())',[crypto.randomUUID(),email,await bcrypt.hash(password,12),'Owner','ADMIN']);
      console.log(JSON.stringify({email,password}));
    } else console.log('Requested admin email already exists; its password was not changed.');
    const after=await db.query('SELECT (SELECT count(*) FROM "Inquiry")::int AS enquiries, (SELECT count(*) FROM "Reservation")::int AS bookings');
    console.log(JSON.stringify({before:before.rows[0],after:after.rows[0],status:'Upgrade complete; existing records preserved'}));
  }catch(error){console.error(JSON.stringify({error:'Dashboard upgrade failed',code:error.code}));process.exitCode=1;}finally{await db.end();}
})();
