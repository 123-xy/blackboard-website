"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarPlus, CalendarX, MessageSquarePlus, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getRecentActivityAction } from "@/app/actions/dashboard-actions";

type Activity = Awaited<ReturnType<typeof getRecentActivityAction>>;
const STORAGE_KEY = "admin_notifications_last_seen";

const ICONS = {
  reservation: { Icon: CalendarPlus, className: "bg-green-500/15 text-green-500" },
  cancellation: { Icon: CalendarX, className: "bg-error/15 text-error" },
  inquiry: { Icon: MessageSquarePlus, className: "bg-gold/15 text-gold-text" },
  subscriber: { Icon: Mail, className: "bg-blue-500/15 text-blue-500" },
} as const;

export default function NotificationBell() {
  const [data, setData] = useState<Activity | null>(null);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRecentActivityAction().then((result) => {
      setData(result);
      setLastSeen(Number(localStorage.getItem(STORAGE_KEY) || 0));
    });
    const interval = setInterval(() => {
      getRecentActivityAction().then(setData);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activity = data?.ok ? data.activity : [];
  const unreadCount = activity.filter((a) => new Date(a.time).getTime() > lastSeen).length;

  const markAllRead = () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setLastSeen(now);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-card-border text-muted transition-colors hover:border-gold hover:text-gold"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-[340px] rounded-lg border border-card-border bg-surface p-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold text-heading">Notifications</span>
            <button onClick={markAllRead} className="text-xs font-semibold text-gold-text hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {activity.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted">No recent activity.</div>
            ) : (
              activity.map((a) => {
                const { Icon, className } = ICONS[a.type];
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-cream-input">
                    <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${className}`}>
                      <Icon size={15} strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-heading">{a.message}</div>
                      <div className="text-[11px] text-muted">{formatDistanceToNow(new Date(a.time), { addSuffix: true })}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
