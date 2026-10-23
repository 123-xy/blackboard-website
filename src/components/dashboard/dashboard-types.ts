export const permissions = ["enquiries","followups","bookings","gallery","settings","staff"] as const;
export type Permission = typeof permissions[number];
export type FollowUp = {id:string;enquiryId:string;customer:string;phone:string;service:string;task:string;due:string;notes:string;assignedTo:string;completed:boolean};
export type Photo = {id:string;title:string;category:string;alt:string;src:string;published:boolean;order:number;trashed:boolean};
export type WebsiteSettings = {businessName:string;tagline:string;phone:string;email:string;address:string;website:string;heading:string;description:string;instagram:string;maps:string;services:{title:string;description:string}[];faqs:{question:string;answer:string}[]};
export type StaffMember = {id:string;name:string;email:string;role:string;active:boolean;permissions:Permission[];invited?:boolean};
export type DashboardExtras = {followups:FollowUp[];photos:Photo[];settings:WebsiteSettings;staff:StaffMember[];currentUser:{id:string;name:string;permissions:Permission[];owner:boolean};notificationChannels:{email:boolean;whatsapp:boolean}};
export const defaultSettings:WebsiteSettings={businessName:"Blackboard Cafe",tagline:"Great Food, Great Life",phone:"+91 99496 70225",email:"Venuacha@whiteboard.cafe",address:"Hyderabad, Telangana, India",website:"blackboardrestaurant.com",heading:"GREAT FOOD, GREAT LIFE",description:"Welcome to Blackboard Cafe, where delicious food meets a warm and friendly atmosphere.",instagram:"https://www.instagram.com/blackboardrestaurat",maps:"",services:[{title:"Cafe Dining",description:"All-day breakfast, coffee and comfort food in a cozy, co-working friendly setting."},{title:"Institutional Catering",description:"Nutritious, hygienic meals for 4,000+ students daily, with cashless meal-card payment."},{title:"Corporate Catering",description:"Customized menus for 1,000+ employees, run from centralized kitchens."},{title:"Event Catering",description:"High-volume catering for exhibitions and conferences, including HITEX Exhibition Centre."}],faqs:[{question:"What services does Blackboard Cafe offer?",answer:"Cafe dining and corporate, institutional and event catering."},{question:"How do I reach you for a catering enquiry?",answer:"Call +91 99496 70225 or email Venuacha@whiteboard.cafe."}]};
export const defaultPhotos:Photo[]=[
 {id:"cafe-interior",title:"The Dining Hall",category:"Cafe interiors",alt:"Cafe interior with tables and chairs",src:"/images/cafe-interior.jpg",published:true,order:1,trashed:false},
 {id:"signature-dishes",title:"Signature Dishes",category:"Food",alt:"Dishes from the Blackboard kitchen",src:"/images/signature-dishes.jpg",published:true,order:2,trashed:false},
 {id:"event-catering",title:"Buffet Setup",category:"Catering",alt:"Buffet and event catering setup",src:"/images/event-catering.jpg",published:true,order:3,trashed:false},
 {id:"corporate-setup",title:"Corporate Catering",category:"Catering",alt:"Corporate catering setup",src:"/images/corporate-setup.jpg",published:true,order:4,trashed:false},
 {id:"outdoor-seating",title:"Outdoor Seating",category:"Cafe interiors",alt:"Outdoor cafe seating",src:"/images/outdoor-seating.jpg",published:true,order:5,trashed:false},
 {id:"fresh-bakes",title:"Fresh Bakes",category:"Food",alt:"Freshly baked food",src:"/images/fresh-bakes.jpg",published:true,order:6,trashed:false},
 {id:"celebrations",title:"Celebrations",category:"Catering",alt:"Celebrations at Blackboard Cafe",src:"/images/celebrations.jpg",published:true,order:7,trashed:false},
 {id:"behind-the-scenes",title:"Behind the Scenes",category:"Cafe interiors",alt:"Behind the scenes at Blackboard",src:"/images/behind-the-scenes.jpg",published:true,order:8,trashed:false},
];

// Preserve the existing site's full FAQ content until the owner edits it.
defaultSettings.faqs=[
 {question:"What services does Blackboard Cafe offer?",answer:"Premium café dining, conference & meeting facilities, and customized catering for corporate offices, educational institutions, and events."},
 {question:"Do you cater for corporate offices?",answer:"Yes — we run centralized-kitchen corporate catering with customized weekly and monthly menus, at a capacity of 1,000+ employees."},
 {question:"Do you cater for schools and colleges?",answer:"Yes — our institutional catering serves 4,000+ students daily with nutritious, hygienic meals and cashless meal-card payment systems."},
 {question:"Have you handled large events or exhibitions?",answer:"Yes — we have event and exhibition catering experience at HITEX Exhibition Centre, covering trade fairs, conferences, and corporate events."},
 {question:"How do I reach you for a catering enquiry?",answer:"Call +91 99496-70225, email Venuacha@whiteboard.cafe, or use the contact form or WhatsApp button on this page."},
];
