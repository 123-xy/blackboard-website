// Run locally after initializing the new database. Password input stays hidden.
require('@next/env').loadEnvConfig(process.cwd());
const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
  const input = readline.createInterface({input:process.stdin,output:process.stdout});
  const email = (await input.question('Admin email: ')).trim().toLowerCase();
  input.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  process.stdout.write('New admin password (at least 16 characters; hidden): ');
  const hidden = new Writable({write(chunk,encoding,callback){callback();}});
  const secretInput = readline.createInterface({input:process.stdin,output:hidden,terminal:true});
  const password = await secretInput.question('');
  secretInput.close();
  process.stdout.write('\n');
  if (password.length < 16) throw new Error('Password must contain at least 16 characters.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing.');
  const db = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000})});
  try {
    if (await db.adminUser.findUnique({where:{email},select:{id:true}})) throw new Error('Account already exists. No changes made.');
    await db.adminUser.create({data:{email,passwordHash:await bcrypt.hash(password,12),role:'ADMIN'}});
    console.log('Admin account created. Sign in at /admin/login.');
  } finally { await db.$disconnect(); }
}
main().catch(error=>{console.error(error.message.includes('Account already exists') || error.message.startsWith('Password') || error.message.startsWith('Enter ') || error.message.startsWith('Run ') || error.message==='DATABASE_URL is missing.' ? error.message : 'Setup failed. Check the database connection and schema.');process.exitCode=1;});
