import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import CafeDashboard from "@/components/dashboard/CafeDashboard";
import { loadDashboardData } from "./dashboard-actions";
import { logoutAction } from "./actions";
import {loadDashboardExtras} from "./redesign-actions";

export const metadata = {title:"Admin Dashboard | Blackboard Cafe",robots:{index:false,follow:false}};

export default async function AdminPage(){
  const session=await auth();
  if(!session)redirect("/admin/login");
  const loaded=await Promise.all([loadDashboardData(),loadDashboardExtras()]).catch(()=>null);
  if(!loaded){
    return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6"><h1 className="text-3xl font-bold">Dashboard temporarily unavailable</h1><p>Your session may have expired or the database may be unavailable. Your saved records are unchanged.</p><Link href="/admin" className="text-gold">Try again</Link><form action={logoutAction}><button type="submit" className="rounded-lg border border-gold px-5 py-3 text-gold">Sign in again</button></form></main>;
  }
  return <CafeDashboard initialData={loaded[0]} initialExtras={loaded[1]}/>;
}
