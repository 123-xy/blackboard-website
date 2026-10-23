"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { CalendarDays, Check, Mail, Plus, ChevronRight, Search, X } from "lucide-react";
import styles from "./CafeDashboard.module.css";

type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type Booking = {id:string;enquiryId?:number|string;name:string;phone:string;email:string;service:string;date:string;time:string;guests:number;venue:string;requirements:string;notes:string;status:BookingStatus};
export const initialBookings: Booking[] = [
  {id:"sample-kiran",name:"Kiran Reddy",phone:"+91 XXXXX XXXXX",email:"kiran@example.com",service:"Cafe dining",date:"2026-11-04",time:"19:00",guests:12,venue:"Blackboard Cafe",requirements:"Family dinner. Seating for 12.",notes:"Confirm seating arrangement before arrival.",status:"Confirmed"},
  {id:"sample-ananya",enquiryId:1,name:"Ananya Rao",phone:"+91 XXXXX XXXXX",email:"ananya@example.com",service:"Corporate catering",date:"2026-10-28",time:"12:30",guests:150,venue:"Customer office",requirements:"Lunch catering for our office event.",notes:"Share menu and quotation.",status:"Pending"},
  {id:"sample-rahul",enquiryId:2,name:"Rahul Sharma",phone:"+91 XXXXX XXXXX",email:"rahul@example.com",service:"Event catering",date:"2026-10-30",time:"18:00",guests:80,venue:"Customer venue",requirements:"Team celebration and buffet service.",notes:"Confirm setup time with the organiser.",status:"Confirmed"},
];
function dateLabel(value:string) { return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`)); }
function timeLabel(value:string) {const [hours,minutes]=value.split(":").map(Number);return `${hours%12||12}:${String(minutes).padStart(2,"0")} ${hours>=12?"PM":"AM"}`;}
function Badge({status}:{status:BookingStatus}) {return <span className={`${styles.badge} ${styles[status.toLowerCase()]}`}><span/>{status}</span>;}

export default function BookingWorkspace({bookings,setBookings,draft,adding,onDraftChange,onAddingChange,live=false,onSave,onAdd}:{bookings:Booking[];setBookings:Dispatch<SetStateAction<Booking[]>>;draft:Booking|null;adding:boolean;onDraftChange:(value:Booking|null)=>void;onAddingChange:(value:boolean)=>void;live?:boolean;onSave?:(input:unknown,create:boolean)=>Promise<{ok:boolean;error?:string}>;onAdd?:()=>void}) {
  const [selectedId,setSelectedId]=useState<string|null>(bookings[0]?.id||null);
  const [saving,setSaving]=useState(false);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All statuses");
  const [period,setPeriod]=useState("Upcoming");
  const [notice,setNotice]=useState("");
  const [cancelPrompt,setCancelPrompt]=useState(false);
  const selected=draft || bookings.find(item=>item.id===selectedId) || null;
  const inPeriod=(item:Booking,label:string)=>label==="Upcoming"?["Pending","Confirmed"].includes(item.status)&&item.date>=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}):label==="All"||item.status===label;
  const visible=bookings.filter(item=>`${item.name} ${item.email} ${item.service}`.toLowerCase().includes(search.toLowerCase())&&(filter==="All statuses"||item.status===filter)&&inPeriod(item,period)).sort((a,b)=>a.date.localeCompare(b.date));
  function selectBooking(item:Booking) {onDraftChange(null);onAddingChange(false);setSelectedId(item.id);setNotice("");setCancelPrompt(false);}
  async function persist(value:Booking,create:boolean){if(!onSave)return true;setSaving(true);try{const result=await onSave(value,create);if(!result.ok)setNotice(result.error||"Unable to save.");return result.ok;}catch{setNotice("Connection failed. Your changes were not saved.");return false;}finally{setSaving(false);}}
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(!selected)return;
    const form=new FormData(event.currentTarget);
    const updated:Booking={...selected,status:form.get("status") as BookingStatus,notes:String(form.get("notes")||"")};
    if(adding){
      Object.assign(updated,{name:String(form.get("name")||"").trim(),phone:String(form.get("phone")||"").trim(),email:String(form.get("email")||"").trim(),service:String(form.get("service")),date:String(form.get("date")),time:String(form.get("time")),guests:Number(form.get("guests")),venue:String(form.get("venue")||"").trim(),requirements:String(form.get("requirements")||"")});
      if(!updated.name || !updated.date || !updated.time || !Number.isInteger(updated.guests) || updated.guests<1){setNotice("Enter a customer, date, time and valid guest count.");return;}
    }
    if(!await persist(updated,adding))return;
    setBookings(items=>adding?[updated,...items]:items.map(item=>item.id===updated.id?updated:item));
    onDraftChange(null);onAddingChange(false);setSelectedId(updated.id);setCancelPrompt(false);setNotice(live?(adding?"Booking created.":"Changes saved."):(adding?"Booking created in this preview.":"Changes saved in this preview."));
  }
  async function cancel() {if(!selected)return;if(!await persist({...selected,status:"Cancelled"},false))return;setBookings(items=>items.map(item=>item.id===selected.id?{...item,status:"Cancelled"}:item));onDraftChange(null);setSelectedId(selected.id);setCancelPrompt(false);setNotice(live?"Booking cancelled.":"Booking cancelled in this preview.");}
  return <div className={`${styles.workspace} ${styles.management} ${!selected?styles.fullWidth:""}`}>
    <section className={styles.panel} aria-label="Bookings list"><div className={styles.bookingsHeading}><h2 className={styles.sectionTitle}>Bookings</h2><button className={styles.goldButton} onClick={onAdd}><Plus size={20}/>Add booking</button></div><div className={`${styles.filters} ${styles.bookingsFilters}`}><label className={styles.search}><Search size={23}/><input aria-label="Search bookings" placeholder="Search bookings (name, email, service...)" value={search} onChange={event=>setSearch(event.target.value)}/></label><select aria-label="Filter bookings" value={filter} onChange={event=>setFilter(event.target.value)}>{["All statuses","Pending","Confirmed","Cancelled","Completed"].map(value=><option key={value}>{value}</option>)}</select></div><div className={`${styles.tabs} ${styles.bookingTabs}`}>{["Upcoming","Completed","Cancelled","All"].map(label=><button className={period===label?styles.tabActive:""} key={label} onClick={()=>setPeriod(label)}>{label} ({bookings.filter(b=>inPeriod(b,label)).length})</button>)}</div>
      <div className={styles.tableScroll}><table><thead><tr><th>Event date</th><th>Customer</th><th>Service</th><th>Guests</th><th>Status</th><th/></tr></thead><tbody>{visible.map(item=><tr key={item.id} className={selected?.id===item.id?styles.selectedRow:undefined}><td>{dateLabel(item.date)}</td><td>{item.name}</td><td>{item.service}</td><td>{item.guests}</td><td><Badge status={item.status}/></td><td><button className={styles.viewButton} aria-label={`View booking for ${item.name}`} onClick={()=>selectBooking(item)}><ChevronRight size={20}/></button></td></tr>)}</tbody></table>{!visible.length&&<div className={styles.empty}>No bookings match your filters.<button onClick={()=>{setSearch("");setFilter("All statuses");setPeriod("All");}}>Show all bookings</button></div>}</div>
    </section>
    {selected&&<section className={`${styles.panel} ${styles.detail}`} aria-labelledby="booking-details"><div className={styles.detailHeading}><h2 id="booking-details">{adding?"Add booking":"Booking details"}</h2><button aria-label="Close booking details" onClick={()=>{setSelectedId(null);onDraftChange(null);onAddingChange(false);setCancelPrompt(false);}}><X size={27}/></button></div>
      <form key={`${selected.id}-${adding}-${selected.status}`} onSubmit={save}>
        {adding?<><label className={styles.field}>Customer<input autoFocus required name="name" defaultValue={selected.name} placeholder="Customer name" maxLength={100}/></label><div className={styles.editGrid}><label className={styles.field}>Phone<input name="phone" type="tel" required defaultValue={selected.phone} placeholder="Customer phone"/></label><label className={styles.field}>Email<input name="email" type="email" required defaultValue={selected.email} placeholder="customer@example.com"/></label></div><div className={styles.editGrid}><label className={styles.field}>Service<select name="service" defaultValue={selected.service}><option>Cafe dining</option><option>Corporate catering</option><option>Event catering</option><option>Institutional</option></select></label><label className={styles.field}>Date<input required type="date" name="date" defaultValue={selected.date}/></label></div><div className={styles.editGrid}><label className={styles.field}>Time<input required type="time" name="time" defaultValue={selected.time}/></label><label className={styles.field}>Guests<input required type="number" min={1} max={10000} step={1} name="guests" defaultValue={selected.guests}/></label></div><label className={styles.field}>Venue<input name="venue" required defaultValue={selected.venue}/></label><label className={styles.field}>Requirements<textarea name="requirements" defaultValue={selected.requirements} rows={2}/></label></>:<>
          <div className={styles.customerName}><span>Customer</span><strong>{selected.name}</strong></div><div className={styles.contactGrid}><div><span>Phone</span><p>{selected.phone}</p></div><div><span>Email</span><a href={`mailto:${selected.email}`}>{selected.email}</a></div></div><div className={styles.eventGrid}><div><span>Service</span><p>{selected.service}</p></div><div><span>Date</span><p>{dateLabel(selected.date)}</p></div><div><span>Time</span><p>{timeLabel(selected.time)}</p></div></div><div className={styles.venueGrid}><div><span>Guests</span><p>{selected.guests}</p></div><div><span>Venue</span><p>{selected.venue}</p></div></div><label className={styles.field}>Requirements<textarea readOnly value={selected.requirements} rows={2}/></label>
        </>}
        <label className={`${styles.field} ${styles.bookingStatus}`}>Status<select name="status" defaultValue={selected.status}>{["Pending","Confirmed","Cancelled","Completed"].map(value=><option key={value}>{value}</option>)}</select></label><label className={styles.field}>Staff notes<textarea name="notes" defaultValue={selected.notes} rows={2}/></label>
        <div className={styles.detailActions}><button className={styles.callButton} type="button" onClick={()=>{window.location.href=`mailto:${selected.email}`;}}><Mail size={21}/>Contact customer</button><button className={styles.goldButton} type="submit" disabled={saving}>{saving?"Saving…":adding?"Create booking":"Save changes"}</button></div>
        {!adding&&selected.status!=="Cancelled"&&selected.status!=="Completed"&&(!cancelPrompt?<button type="button" className={styles.secondaryButton} onClick={()=>setCancelPrompt(true)}><CalendarDays size={21}/>Cancel booking</button>:<div className={styles.cancelPrompt}><p>Cancel this booking for {selected.name}?</p><div><button type="button" onClick={()=>setCancelPrompt(false)}>Keep booking</button><button type="button" onClick={cancel} disabled={saving}>Yes, cancel booking</button></div></div>)}<p className={styles.notice} role="status">{notice&&<><Check size={16}/>{notice}</>}</p>
      </form>
    </section>}
  </div>;
}
