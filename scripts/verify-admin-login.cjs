// Reads the test password from stdin; never prints credentials or cookies.
const readline=require('node:readline/promises');
const {Writable}=require('node:stream');
const base=process.env.DASHBOARD_TEST_URL||'http://127.0.0.1:3000';
const cookies=new Map();
async function request(path,options={}){
  const response=await fetch(base+path,{...options,redirect:'manual',headers:{...options.headers,Cookie:[...cookies].map(([key,value])=>`${key}=${value}`).join('; ')},signal:AbortSignal.timeout(90000)});
  for(const item of response.headers.getSetCookie()){const first=item.split(';')[0];const at=first.indexOf('=');cookies.set(first.slice(0,at),first.slice(at+1));}
  return response;
}
(async()=>{const input=readline.createInterface({input:process.stdin,output:new Writable({write(chunk,encoding,callback){callback();}}),terminal:true});console.log('Waiting for verification password on stdin');const password=await input.question('');input.close();
  const csrf=await request('/api/auth/csrf');const {csrfToken}=await csrf.json();
  const login=await request('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({email:'admin@blackboardrestaurant.com',password,csrfToken,callbackUrl:base+'/admin'})});
  if(login.status>=400)throw new Error('Login request failed');
  const sessionResponse=await request('/api/auth/session');const session=await sessionResponse.json();
  if(session.user?.email!=='admin@blackboardrestaurant.com')throw new Error('Authenticated session not established');
  const page=await request('/admin');const html=await page.text();
  if(page.status!==200 || !html.includes('Blackboard Cafe · Admin dashboard') || html.includes('Dashboard temporarily unavailable'))throw new Error('Live dashboard failed to render');
  console.log(JSON.stringify({login:true,role:session.user.role,dashboardStatus:page.status,liveData:true}));
})().catch(error=>{console.error('Admin verification failed: '+error.message);process.exitCode=1;});
