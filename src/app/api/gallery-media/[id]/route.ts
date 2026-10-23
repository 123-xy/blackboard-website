import { getAccess,readDocument } from "@/lib/dashboard-store";
import { prisma } from "@/lib/db";
import type {Photo} from "@/components/dashboard/dashboard-types";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-zA-Z\d-]+$/.test(id))return new Response(null,{status:404});
 const photo=await readDocument<Photo>(`photo:${id}`);const published=photo?.published&&!photo.trashed;
 if(!published&&!await getAccess("gallery"))return new Response(null,{status:404});
 const rows=await prisma.$queryRaw<{mime:string;bytes:Uint8Array}[]>`SELECT mime,bytes FROM "GalleryMedia" WHERE id=${id}`;
 if(!rows[0])return new Response(null,{status:404});return new Response(new Uint8Array(rows[0].bytes),{headers:{"Content-Type":rows[0].mime,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
}
