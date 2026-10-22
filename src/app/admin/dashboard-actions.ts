"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Enquiry } from "@/components/dashboard/CafeDashboard";
import type { Booking } from "@/components/dashboard/BookingWorkspace";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {const date=new Date(value+"T00:00:00Z");return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10)===value;},"Invalid date");
const inquiryInput = z.object({id:z.string().min(1),status:z.enum(["New","Contacted","Confirmed","Closed"]),followUp:z.union([day,z.literal("")]),notes:z.string().max(10000)});
const bookingInput=z.object({id:z.string().min(1).max(100),enquiryId:z.string().optional(),name:z.string().trim().min(1).max(100),email:z.email(),phone:z.string().regex(/^[+\d\s()-]{10,25}$/),service:z.enum(["Cafe dining","Corporate catering","Event catering","Institutional"]),date:day,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),guests:z.number().int().min(1).max(10000),venue:z.string().trim().min(1).max(250),requirements:z.string().max(10000),notes:z.string().max(10000),status:z.enum(["Pending","Confirmed","Cancelled","Completed"])});
async function requireUser(){
  const session=await auth();
  if(!session?.user?.id)throw new Error("Unauthorized");
  const user=await prisma.adminUser.findUnique({where:{id:session.user.id},select:{id:true,role:true}});
  if(!user)throw new Error("Unauthorized");
  return user;
}
function isoDay(value:Date|null){return value?.toISOString().slice(0,10)||"";}
function bookingStatus(value:string):Booking["status"] {return ({PENDING:"Pending",CONFIRMED:"Confirmed",COMPLETED:"Completed",CANCELLED:"Cancelled"} as const)[value as "PENDING"] || "Pending";}
export async function loadDashboardData(){
  await requireUser();
  const [inquiries,reservations]=await Promise.all([prisma.inquiry.findMany({where:{isSpam:false},orderBy:{createdAt:"desc"}}),prisma.reservation.findMany({orderBy:{reservationDate:"asc"}})]);
  const enquiries:Enquiry[]=inquiries.map(item=>({id:item.id,name:item.name,email:item.email,phone:item.phone||"Not provided",service:item.subject,status:(["New","Contacted","Confirmed","Closed"].includes(item.dashboardStatus||"")?item.dashboardStatus:({NEW:"New",IN_PROGRESS:"Contacted",RESOLVED:"Closed"} as const)[item.status]) as Enquiry["status"],date:isoDay(item.eventDate),guests:item.guestCount||0,followUp:isoDay(item.followUpDate),message:item.message,notes:item.staffNotes||"",received:isoDay(item.createdAt)}));
  const bookings:Booking[]=reservations.map(item=>({id:item.id,enquiryId:item.inquiryId||undefined,name:item.customerName,email:item.email,phone:item.phone,service:item.service,date:isoDay(item.reservationDate),time:item.reservationTime,guests:item.guests,venue:item.venue,requirements:item.notes||"",notes:item.staffNotes||"",status:bookingStatus(item.status)}));
  return {enquiries,bookings};
}
export async function saveDashboardInquiry(input:unknown){
  try{await requireUser();const value=inquiryInput.parse(input);await prisma.inquiry.update({where:{id:value.id},data:{dashboardStatus:value.status,status:value.status==="New"?"NEW":value.status==="Closed"?"RESOLVED":"IN_PROGRESS",staffNotes:value.notes,followUpDate:value.followUp?new Date(value.followUp+"T00:00:00Z"):null}});return {ok:true as const};}catch{return {ok:false as const,error:"Could not save this enquiry. Check your session and try again."};}
}
export async function saveDashboardBooking(input:unknown,create:boolean){
  try{
    await requireUser();const value=bookingInput.parse(input);
    const status=({Pending:"PENDING",Confirmed:"CONFIRMED",Cancelled:"CANCELLED",Completed:"COMPLETED"} as const)[value.status];
    const data={customerName:value.name,email:value.email,phone:value.phone,service:value.service,reservationDate:new Date(value.date+"T00:00:00Z"),reservationTime:value.time,guests:value.guests,venue:value.venue,notes:value.requirements,staffNotes:value.notes,status};
    if(create){
      if(value.enquiryId){const inquiry=await prisma.inquiry.findUnique({where:{id:value.enquiryId},select:{id:true}});if(!inquiry)return {ok:false as const,error:"The source enquiry no longer exists."};}
      await prisma.reservation.create({data:{...data,id:value.id,inquiryId:value.enquiryId,confirmationCode:randomBytes(9).toString("hex").toUpperCase()}});
    }else await prisma.reservation.update({where:{id:value.id},data});
    return {ok:true as const};
  }catch{return {ok:false as const,error:"Could not save this booking. Check the details and try again."};}
}
