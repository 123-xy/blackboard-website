"use server";
import { z } from "zod";
import { randomBytes,createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getAccess,readDocument,writeDocument,getGalleryPhotos,getWebsiteSettings } from "@/lib/dashboard-store";
import { permissions,type DashboardExtras,type FollowUp,type Permission,type StaffMember } from "@/components/dashboard/dashboard-types";

const text=z.string().trim().max(10000);
const safeLink=z.union([z.literal(""),z.url().refine(value=>value.startsWith("https://"))]);
const settingsSchema=z.object({businessName:text.min(1),tagline:text,phone:z.string().regex(/^[+\d\s()-]{10,25}$/),email:z.email(),address:text,website:z.string().regex(/^[a-z\d.-]+$/i),heading:text.min(1),description:text,instagram:safeLink,maps:safeLink,services:z.array(z.object({title:text.min(1),description:text})).max(12),faqs:z.array(z.object({question:text.min(1),answer:text})).max(30)});
const photoSchema=z.object({id:z.string().regex(/^[a-zA-Z\d-]+$/),title:text.min(1),category:z.enum(["Cafe interiors","Food","Catering"]),alt:text.min(1),src:z.string().regex(/^\/(images\/[a-zA-Z\d_.-]+|api\/gallery-media\/[a-zA-Z\d-]+)$/),published:z.boolean(),order:z.number().int().min(0).max(10000),trashed:z.boolean()});
const taskSchema=z.object({id:z.string().min(1).max(100),enquiryId:text,customer:text.min(1),phone:text,service:text,task:text.min(1),due:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).refine(value=>!Number.isNaN(Date.parse(value+"+05:30"))),notes:text,assignedTo:text,completed:z.boolean()});
export async function loadDashboardExtras():Promise<DashboardExtras>{
 const user=await getAccess();if(!user)throw new Error("Unauthorized");
 const [tasks,photos,settings,users,invitations]=await Promise.all([
  user.permissions.includes("followups")?prisma.$queryRaw<{data:FollowUp}[]>`SELECT data FROM "DashboardDocument" WHERE id LIKE 'followup:%'`:[],
  user.permissions.includes("gallery")?getGalleryPhotos():[],getWebsiteSettings(),
  user.owner?prisma.adminUser.findMany({select:{id:true,email:true,name:true,role:true}}):[],
  user.owner?prisma.$queryRaw<{data:{email:string;name:string;role:string;expires:number;accepted?:boolean}}[]>`SELECT data FROM "DashboardDocument" WHERE id LIKE 'invite:%'`:[]
 ]);
 const staff:StaffMember[]=await Promise.all(users.map(async item=>{const access=await readDocument<{active:boolean;permissions:Permission[];displayRole:string}>(`access:${item.id}`);return {id:item.id,name:item.name||item.email,email:item.email,role:item.role==="ADMIN"?"Owner":access?.displayRole||"Manager",active:access?.active!==false,permissions:item.role==="ADMIN"?[...permissions]:access?.permissions||["enquiries","bookings","followups"]};}));
 invitations.filter(item=>!item.data.accepted&&item.data.expires>Date.now()).forEach(({data})=>staff.push({id:`invited:${data.email}`,name:data.name||"New team member",email:data.email,role:data.role,active:false,permissions:[],invited:true}));
 return {followups:tasks.map(row=>row.data),photos,settings,staff,currentUser:{id:user.id,name:user.name||user.email,permissions:user.permissions,owner:user.owner},notificationChannels:{email:!!process.env.RESEND_API_KEY,whatsapp:!!(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_WHATSAPP_NUMBER)}};
}
export async function saveFollowUp(input:unknown){try{if(!await getAccess("followups"))throw new Error();const task=taskSchema.parse(input);await writeDocument(`followup:${task.id}`,task);return {ok:true as const};}catch{return {ok:false as const,error:"Unable to save this follow-up."};}}
export async function saveGalleryPhoto(input:unknown){try{if(!await getAccess("gallery"))throw new Error();const photo=photoSchema.parse(input);await writeDocument(`photo:${photo.id}`,photo);return {ok:true as const};}catch{return {ok:false as const,error:"Unable to save this photo."};}}
export async function saveWebsiteSettings(input:unknown){try{if(!await getAccess("settings"))throw new Error();const settings=settingsSchema.parse(input);await writeDocument("website-settings",settings);return {ok:true as const};}catch{return {ok:false as const,error:"Unable to save. Check the email, phone and HTTPS links."};}}
export async function updateStaffAccess(input:unknown){
 try{const owner=await getAccess("staff");if(!owner?.owner)throw new Error();const value=z.object({id:z.string(),name:text.min(1),role:z.enum(["Owner","Manager","Editor"]),active:z.boolean(),permissions:z.array(z.enum(permissions))}).parse(input);
  const target=await prisma.adminUser.findUnique({where:{id:value.id}});if(!target)throw new Error();
  if(target.role!=="ADMIN"&&value.role==="Owner")return {ok:false as const,error:"Owner access cannot be assigned from this form."};
  if(target.id===owner.id&&!value.active)return {ok:false as const,error:"You cannot deactivate your own account."};
  if(target.role==="ADMIN"&&!value.active){const admins=await prisma.adminUser.findMany({where:{role:"ADMIN"},select:{id:true}});const active=await Promise.all(admins.map(async item=>(await readDocument<{active:boolean}>(`access:${item.id}`))?.active!==false));if(active.filter(Boolean).length<=1)return {ok:false as const,error:"The last owner must keep access."};}
  await prisma.adminUser.update({where:{id:value.id},data:{name:value.name}});
  await writeDocument(`access:${value.id}`,{active:value.active,displayRole:target.role==="ADMIN"?"Owner":value.role,permissions:target.role==="ADMIN"?[...permissions]:value.permissions.filter(item=>item!=="staff")});return {ok:true as const};
 }catch{return {ok:false as const,error:"Unable to update staff access."};}
}
export async function createStaffInvitation(input:unknown){
 try{const owner=await getAccess("staff");if(!owner?.owner)throw new Error();const value=z.object({email:z.email(),role:z.enum(["Manager","Editor"])}).parse(input);const email=value.email.toLowerCase();if(await prisma.adminUser.findUnique({where:{email}}))return {ok:false as const,error:"An account already uses this email."};
  const token=randomBytes(32).toString("hex");const hash=createHash("sha256").update(token).digest("hex");await writeDocument(`invite:${hash}`,{email,name:"",role:value.role,expires:Date.now()+72*3600000,accepted:false});return {ok:true as const,path:`/admin/accept-invitation?token=${token}`};
 }catch{return {ok:false as const,error:"Unable to create an invitation."};}
}
