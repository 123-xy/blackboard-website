// Integration check: uses only its own marked records and removes them in finally.
module.exports=async function verifyDashboardWrites({request,base,html}){
  require('@next/env').loadEnvConfig(process.cwd());
  const {Client}=require('pg');const crypto=require('node:crypto');
  const ids={};
  const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]);
  for(const path of scripts){
    const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(30000)});const source=await response.text();
    for(const name of ['saveDashboardBooking','saveDashboardInquiry']){
      let offset=source.indexOf('"'+name+'"');
      while(offset>=0){const hashes=[...source.slice(Math.max(0,offset-300),offset).matchAll(/"([a-f0-9]{40,64})"/g)];if(hashes.length)ids[name]=hashes.at(-1)[1];offset=source.indexOf('"'+name+'"',offset+name.length+2);}
    }
  }
  if(!ids.saveDashboardBooking||!ids.saveDashboardInquiry)throw new Error('Could not locate deployed dashboard actions');
  const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
  const bookingId='dashboard-check-'+crypto.randomUUID();const inquiryId='dashboard-check-'+crypto.randomUUID();
  async function action(name,args){const response=await request('/admin',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Next-Action':ids[name],Origin:base},body:JSON.stringify(args)});const text=await response.text();if(response.status!==200||!text.includes('"ok":true'))throw new Error('Dashboard save action failed');}
  try{
    await db.connect();
    await db.query('INSERT INTO "Inquiry" (id,name,email,phone,subject,message,status,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())',[inquiryId,'Dashboard verification','dashboard-check@example.invalid','+919999999999','Corporate catering','Temporary integration verification','NEW']);
    await action('saveDashboardInquiry',[{id:inquiryId,status:'Contacted',followUp:'2026-11-01',notes:'Verified enquiry save'}]);
    const inquiry=await db.query('SELECT "dashboardStatus","staffNotes" FROM "Inquiry" WHERE id=$1',[inquiryId]);
    if(inquiry.rows[0]?.dashboardStatus!=='Contacted'||inquiry.rows[0]?.staffNotes!=='Verified enquiry save')throw new Error('Enquiry did not persist');
    const booking={id:bookingId,enquiryId:inquiryId,name:'Dashboard verification',email:'dashboard-check@example.invalid',phone:'+919999999999',service:'Corporate catering',date:'2026-11-01',time:'12:00',guests:2,venue:'Verification only',requirements:'Temporary test; not a real booking',notes:'Verified create',status:'Pending'};
    await action('saveDashboardBooking',[booking,true]);
    await action('saveDashboardBooking',[{...booking,status:'Confirmed',notes:'Verified update'},false]);
    let stored=await db.query('SELECT status,"staffNotes","inquiryId" FROM "Reservation" WHERE id=$1',[bookingId]);
    if(stored.rows[0]?.status!=='CONFIRMED'||stored.rows[0]?.staffNotes!=='Verified update'||stored.rows[0]?.inquiryId!==inquiryId)throw new Error('Booking update did not persist');
    const page=await request('/admin');if(!(await page.text()).includes('Dashboard verification'))throw new Error('Saved records did not load in dashboard');
    await action('saveDashboardBooking',[{...booking,status:'Cancelled'},false]);
    stored=await db.query('SELECT status FROM "Reservation" WHERE id=$1',[bookingId]);if(stored.rows[0]?.status!=='CANCELLED')throw new Error('Cancellation did not persist');
    console.log(JSON.stringify({enquirySave:true,createBooking:true,updateBooking:true,dashboardReload:true,cancelBooking:true}));
  }finally{
    try{await db.query('DELETE FROM "Reservation" WHERE id=$1',[bookingId]);await db.query('DELETE FROM "Inquiry" WHERE id=$1',[inquiryId]);console.log('Verification records removed.');}finally{await db.end();}
  }
};
