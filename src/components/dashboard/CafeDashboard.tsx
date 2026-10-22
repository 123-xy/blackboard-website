"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronRight, FileText, Home, LogOut, Mail, Phone, Search, UserRound, UsersRound, X, Check } from "lucide-react";
import styles from "./CafeDashboard.module.css";
import BookingWorkspace, { initialBookings, type Booking } from "./BookingWorkspace";
import { saveDashboardInquiry, saveDashboardBooking } from "@/app/admin/dashboard-actions";
import { signOut } from "next-auth/react";

type Status = "New" | "Contacted" | "Confirmed" | "Closed";
export type Enquiry = { id: number | string; name: string; service: string; status: Status; phone: string; email: string; guests: number; date: string; followUp: string; message: string; notes: string; received?:string };
const initialEnquiries: Enquiry[] = [
  { id: 1, name: "Ananya Rao", service: "Corporate catering", status: "New", phone: "+91 XXXXX XXXXX", email: "ananya@example.com", guests: 150, date: "2026-10-28", followUp: "2026-10-24", message: "Lunch catering for our office event.", notes: "Share menu and quotation." },
  { id: 2, name: "Rahul Sharma", service: "Event catering", status: "Contacted", phone: "+91 XXXXX XXXXX", email: "rahul@example.com", guests: 80, date: "2026-11-02", followUp: "2026-10-26", message: "Looking for catering for our upcoming team celebration.", notes: "Confirm the venue and menu preferences." },
  { id: 3, name: "Kiran Reddy", service: "Cafe dining", status: "Confirmed", phone: "+91 XXXXX XXXXX", email: "kiran@example.com", guests: 12, date: "2026-11-04", followUp: "", message: "A table for our team lunch, please.", notes: "Booking confirmed. Arrange a shared table." },
  { id: 4, name: "Meera Patel", service: "Institutional", status: "Closed", phone: "+91 XXXXX XXXXX", email: "meera@example.com", guests: 200, date: "2026-11-06", followUp: "", message: "Information about catering for our institution.", notes: "Enquiry closed after sharing the requested information." },
];
function formatDate(value: string) {
  if(!value) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z"));
}
function StatusBadge({status}: {status: Status}) {
  return <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}><span />{status}</span>;
}

export default function CafeDashboard({initialData}:{initialData?:{enquiries:Enquiry[];bookings:Booking[]}}) {
  const live=!!initialData;
  const [tab, setTab] = useState("Overview");
  const [enquiries, setEnquiries] = useState(initialData?.enquiries || initialEnquiries);
  const [selected, setSelected] = useState<Enquiry | null>((initialData?.enquiries || initialEnquiries)[0] || null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [notice, setNotice] = useState("");
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(initialData?.bookings || initialBookings);
  const [saving,setSaving]=useState(false);
  const [bookingDraft, setBookingDraft] = useState<Booking | null>(null);
  const [addingBooking, setAddingBooking] = useState(false);
  const visible = enquiries.filter(item => (live || (tab === "Overview" ? item.id !== 4 : item.id !== 3)) && (status === "All statuses" || item.status === status) && `${item.name} ${item.service} ${item.email}`.toLowerCase().includes(search.toLowerCase()));
  const confirmed = enquiries.filter(item => item.status === "Confirmed");
  const upcoming = bookings.filter(item=>item.status==="Confirmed" && item.date>=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})).slice(0,3);
  function chooseTab(next: string) { setTab(next); setNotice(""); setSearch(""); setStatus("All statuses"); }
  function createBooking() {
    if (!selected) return;
    const existing = bookings.find(item => item.enquiryId === selected.id);
    setBookingDraft(existing || {id:crypto.randomUUID(),enquiryId:selected.id,name:selected.name,phone:selected.phone,email:selected.email,service:selected.service,date:selected.date,time:"19:00",guests:selected.guests,venue:"Blackboard Cafe",requirements:selected.message,notes:selected.notes,status:"Pending"});
    setAddingBooking(!existing);
    chooseTab("Bookings");
  }
  async function saveEnquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const values = new FormData(event.currentTarget);
    const updated = {...selected, status: values.get("status") as Status, followUp: String(values.get("followUp") || ""), notes: String(values.get("notes") || "")};
    if(live){setSaving(true);try{const result=await saveDashboardInquiry(updated);if(!result.ok){setNotice(result.error);return;}}catch{setNotice("Connection failed. Your changes were not saved.");return;}finally{setSaving(false);}}
    setEnquiries(items => items.map(item => item.id === updated.id ? updated : item));
    setSelected(updated);
    setNotice(live?"Changes saved.":"Changes saved in this preview.");
  }
  function logout(){if(live){void signOut({callbackUrl:"/admin/login"});}else setSignedOut(true);}
  if (signedOut) return <div className={styles.signedOut}><div className={styles.brand}><strong>BLACKBOARD</strong><b>CAFE</b><span>GREAT FOOD, GREAT LIFE</span></div><h1>You’re signed out of the preview.</h1><p>No live admin session was changed.</p><button className={styles.goldButton} onClick={() => setSignedOut(false)}>Back to dashboard</button><Link href="/admin/login">Go to admin login <ArrowUpRight size={16} /></Link></div>;
  return <div className={styles.dashboard}>
    <aside className={styles.sidebar} aria-label="Dashboard navigation">
      <Link href="/" className={styles.brand} aria-label="Blackboard Cafe home"><strong>BLACKBOARD</strong><b>CAFE</b><span>GREAT FOOD, GREAT LIFE</span></Link>
      <nav>{[{label:"Overview",icon:Home},{label:"Enquiries",icon:Mail},{label:"Bookings",icon:CalendarDays}].map(({label,icon:Icon}) => <button key={label} className={`${styles.navItem} ${tab === label ? styles.active : ""}`} aria-current={tab === label ? "page" : undefined} onClick={() => chooseTab(label)}><Icon size={29} strokeWidth={1.7} fill={label === "Overview" && tab === label ? "currentColor" : "none"} />{label}</button>)}</nav>
      <button className={`${styles.navItem} ${styles.signOut}`} onClick={logout}><LogOut size={28} strokeWidth={1.7} />Sign Out</button>
    </aside>
    <main className={styles.main}>
      <header className={styles.header}>
        <div><h1>{tab === "Overview" ? "Dashboard" : tab}</h1><p>{tab === "Overview" ? "Your café at a glance" : tab === "Enquiries" ? "Manage customer messages and follow-ups" : "Manage upcoming café and catering bookings"}</p></div>
        <div className={styles.headerActions}><div className={styles.ownerWrap}><button className={styles.owner} aria-expanded={ownerOpen} onClick={() => setOwnerOpen(!ownerOpen)}><span><UserRound size={22}/></span>Owner<ChevronDown size={17}/></button>{ownerOpen && <div className={styles.ownerMenu}><strong>Owner account</strong><p>{live ? "Administrator" : "Sample account"}</p><button onClick={logout}>Sign out <LogOut size={16}/></button></div>}</div>{tab === "Bookings" ? <button className={styles.website} onClick={()=>{setBookingDraft({id:crypto.randomUUID(),name:"",phone:"",email:"",service:"Cafe dining",date:"",time:"19:00",guests:2,venue:"Blackboard Cafe",requirements:"",notes:"",status:"Pending"});setAddingBooking(true);}}>＋ Add booking</button> : <Link href="/" target="_blank" rel="noopener noreferrer" className={styles.website}><ArrowUpRight size={27}/>View website</Link>}</div>
      </header>
      {tab === "Overview" && <section className={styles.stats} aria-label="Dashboard summary">
        {[{label:"New enquiries",value:(live?0:11) + enquiries.filter(item=>item.status==="New").length,icon:Mail,tone:"amber"},{label:"Follow-ups due",value:enquiries.filter(item=>item.followUp && item.status!=="Confirmed" && item.status!=="Closed" && (!live || item.followUp <= new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}))).length + (live?0:1),icon:FileText,tone:"blue"},{label:"Confirmed bookings",value:live?bookings.filter(item=>item.status==="Confirmed").length:6 + confirmed.length - 1,icon:CalendarDays,tone:"green"}].map(({label,value,icon:Icon,tone}) => <article key={label} className={styles.stat}><span className={`${styles.statIcon} ${styles[tone]}`}><Icon size={39} strokeWidth={1.7}/></span><div><p>{label}</p><strong>{value}</strong></div></article>)}
      </section>}
      {tab === "Bookings" ? <BookingWorkspace bookings={bookings} setBookings={setBookings} draft={bookingDraft} adding={addingBooking} onDraftChange={setBookingDraft} onAddingChange={setAddingBooking} live={live} onSave={live ? saveDashboardBooking : undefined}/> : <div className={`${styles.workspace} ${!selected ? styles.fullWidth : ""} ${tab === "Enquiries" ? styles.management : ""}`}>
        <div className={styles.leftColumn}>
          <section className={styles.panel} aria-labelledby="enquiries-heading">
            <div className={styles.panelHeading}>{tab === "Overview" && <h2 id="enquiries-heading">Recent enquiries</h2>}{tab === "Enquiries" && <h2 id="enquiries-heading" className="sr-only">Customer enquiries</h2>}<div className={styles.filters}><label className={styles.search}><Search size={21}/><input aria-label="Search enquiries" placeholder="Search enquiries..." value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option>New</option><option>Contacted</option><option>Confirmed</option><option>Closed</option></select></div></div>
            <div className={styles.tableScroll}><table><thead><tr><th>{tab === "Enquiries" ? "Customer" : "Name"}</th><th>Service</th>{tab === "Enquiries" && <th>Received</th>}<th>Status</th><th>{tab === "Enquiries" ? "View" : "Action"}</th></tr></thead><tbody>{visible.map(item=><tr key={item.id} className={tab === "Enquiries" && selected?.id === item.id ? styles.selectedRow : undefined}><td>{item.name}</td><td>{tab === "Enquiries" && item.service === "Corporate catering" ? "Corporate" : item.service}</td>{tab === "Enquiries" && <td>{formatDate(item.received || (item.id === 1 ? "2026-10-22" : item.id === 2 ? "2026-10-21" : "2026-10-20"))}</td>}<td><StatusBadge status={item.status}/></td><td><button className={styles.viewButton} aria-label={`View enquiry from ${item.name}`} onClick={()=>{setSelected(item);setNotice("");}}>View</button></td></tr>)}</tbody></table>{!visible.length && <div className={styles.empty}>No enquiries match your search.<button onClick={()=>{setSearch("");setStatus("All statuses");}}>Clear filters</button></div>}</div>
          </section>
          {tab !== "Enquiries" && <section className={`${styles.panel} ${styles.bookings}`} aria-labelledby="bookings-heading"><div className={styles.panelHeading}><h2 id="bookings-heading">{tab === "Overview" ? "Upcoming booking" : "Upcoming bookings"}</h2>{tab === "Overview" && <button className={styles.textButton} onClick={()=>chooseTab("Bookings")}>View all bookings<ChevronRight size={20}/></button>}</div>{upcoming.length ? upcoming.map(item=><button key={item.id} className={styles.bookingRow} onClick={()=>{chooseTab("Bookings");setBookingDraft(item);setAddingBooking(false);}}><strong>{item.name}</strong><span><CalendarDays size={21}/>{formatDate(item.date)}</span><span><UsersRound size={21}/>{item.guests} guests</span><span>{item.service}</span><StatusBadge status="Confirmed"/></button>) : <div className={styles.empty}>No confirmed bookings yet.</div>}</section>}
        </div>
        {selected && <section className={`${styles.panel} ${styles.detail}`} aria-labelledby="detail-heading"><div className={styles.detailHeading}><h2 id="detail-heading">Enquiry details</h2><button aria-label="Close enquiry details" onClick={()=>setSelected(null)}><X size={27} strokeWidth={1.6}/></button></div><form key={selected.id} onSubmit={saveEnquiry}>
          <div className={styles.customerName}><span>Name</span><strong>{selected.name}</strong></div><div className={styles.contactGrid}><div><span>Phone</span><p>{selected.phone}</p></div><div><span>Email</span><Link href={`mailto:${selected.email}`}>{selected.email}</Link></div></div>
          <div className={styles.eventGrid}><div><span>Catering type</span><p>{selected.service === "Corporate catering" ? "Corporate" : selected.service === "Event catering" ? "Event" : "Cafe dining"}</p></div><div><span>Guest count</span><p>{selected.guests}</p></div><div><span>Event date</span><p><CalendarDays size={20}/>{formatDate(selected.date)}</p></div></div>
          <label className={styles.field}>Customer message<textarea value={selected.message} readOnly rows={2}/></label><div className={styles.editGrid}><label className={styles.field}>Status<select name="status" defaultValue={selected.status}><option>New</option><option>Contacted</option><option>Confirmed</option><option>Closed</option></select></label><label className={styles.field}>Follow-up date<input name="followUp" type="date" defaultValue={selected.followUp}/></label></div><label className={styles.field}>Staff notes<textarea name="notes" defaultValue={selected.notes} placeholder="Add notes about this enquiry." rows={2}/></label>
          <div className={styles.detailActions}><button type="button" className={styles.callButton} onClick={()=>{if(live && /^[+\d\s()-]+$/.test(selected.phone)){window.location.href="tel:"+selected.phone.replace(/[^+\d]/g,"");}else setNotice(live?"No customer phone number is available.":"This preview uses masked sample numbers.");}}><Phone size={21} fill="currentColor"/>Call customer</button><button type="submit" className={styles.goldButton} disabled={saving}>{saving?"Saving…":"Save changes"}</button></div><p className={styles.notice} role="status">{notice && <><Check size={16}/>{notice}</>}</p>
          {tab === "Enquiries" && <button type="button" className={styles.secondaryButton} onClick={createBooking}><CalendarDays size={21}/>Create booking</button>}
        </form></section>}
      </div>}
      <footer className={styles.previewLabel}>{live?"Blackboard Cafe · Admin dashboard":"Design preview · Sample data"}</footer>
    </main>
  </div>;
}
