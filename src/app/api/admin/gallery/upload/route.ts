import { getAccess,writeDocument } from "@/lib/dashboard-store";
import { prisma } from "@/lib/db";
import { randomUUID } from "node:crypto";
export async function POST(request:Request){
 if(!await getAccess("gallery"))return Response.json({error:"Unauthorized"},{status:403});
 try{const data=await request.formData();const file=data.get("file");if(!(file instanceof File)||file.size>2*1024*1024)return Response.json({error:"Photo must be under 2 MB after resizing."},{status:400});const bytes=Buffer.from(await file.arrayBuffer());
 const valid=(file.type==="image/webp"&&bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP")||(file.type==="image/jpeg"&&bytes[0]===255&&bytes[1]===216)||(file.type==="image/png"&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 if(!valid)return Response.json({error:"Choose a JPG, PNG or WebP photo."},{status:400});const id=randomUUID();
 await prisma.$executeRaw`INSERT INTO "GalleryMedia" (id,mime,bytes) VALUES (${id},${file.type},${bytes})`;
 const photo={id,title:file.name.replace(/\.[^.]+$/,""),category:"Cafe interiors",alt:file.name.replace(/\.[^.]+$/,""),src:`/api/gallery-media/${id}`,published:false,order:100,trashed:false};await writeDocument(`photo:${id}`,photo);return Response.json({photo});
 }catch{return Response.json({error:"Upload failed. Try again."},{status:500});}
}
