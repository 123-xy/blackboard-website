"use client";
import {createContext,useContext} from "react";
import {defaultSettings,type WebsiteSettings} from "@/components/dashboard/dashboard-types";
const Context=createContext<WebsiteSettings>(defaultSettings);
export function WebsiteSettingsProvider({settings,children}:{settings:WebsiteSettings;children:React.ReactNode}){return <Context.Provider value={settings}>{children}</Context.Provider>;}
export function useWebsiteSettings(){return useContext(Context);}
