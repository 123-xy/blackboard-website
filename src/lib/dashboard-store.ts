import "server-only";
import {createHash} from "node:crypto";
import { prisma } from "./db";
import { auth } from "./auth";
import { defaultPhotos, defaultSettings, permissions, type Permission, type Photo, type WebsiteSettings } from "@/components/dashboard/dashboard-types";

export async function readDocument<T>(id:string):Promise<T|null>{const rows=await prisma.$queryRaw<{data:T}[]>`SELECT data FROM "DashboardDocument" WHERE id=${id}`;return rows[0]?.data||null;}
export async function writeDocument(id:string,data:unknown){const json=JSON.stringify(data);await prisma.$executeRaw`INSERT INTO "DashboardDocument" (id,data,"updatedAt") VALUES (${id},${json}::jsonb,NOW()) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,"updatedAt"=NOW()`;}
export async function readActiveInvitation(token?:string){if(!token||!/^[a-f\d]{64}$/.test(token))return null;const invite=await readDocument<{email:string;role:string;expires:number;accepted:boolean}>(`invite:${createHash("sha256").update(token).digest("hex")}`);return invite&&!invite.accepted&&invite.expires>Date.now()?invite:null;}
export async function getAccess(permission?:Permission){
 const session=await auth();if(!session?.user?.id)return null;
 const user=await prisma.adminUser.findUnique({where:{id:session.user.id},select:{id:true,name:true,email:true,role:true}});if(!user)return null;
 const access=await readDocument<{active:boolean;permissions:Permission[];displayRole:string}>(`access:${user.id}`);
 if(access?.active===false)return null;
 const allowed=user.role==="ADMIN"?[...permissions]:(access?.permissions||["enquiries","bookings","followups"] as Permission[]);
 if(permission&&!allowed.includes(permission))return null;
 return {...user,owner:user.role==="ADMIN",permissions:allowed,displayRole:user.role==="ADMIN"?"Owner":access?.displayRole||"Manager"};
}
export async function getWebsiteSettings():Promise<WebsiteSettings>{try{return await readDocument<WebsiteSettings>("website-settings")||defaultSettings;}catch{return defaultSettings;}}
export async function getGalleryPhotos():Promise<Photo[]>{try{const docs=await prisma.$queryRaw<{id:string;data:Photo}[]>`SELECT id,data FROM "DashboardDocument" WHERE id LIKE 'photo:%'`;const merged=new Map(defaultPhotos.map(photo=>[photo.id,photo]));docs.forEach(row=>merged.set(row.data.id,row.data));return [...merged.values()].sort((a,b)=>a.order-b.order);}catch{return defaultPhotos;}}
