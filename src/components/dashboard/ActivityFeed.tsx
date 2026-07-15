import { CalendarPlus, CalendarX, MessageSquarePlus, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Activity = { id: string; type: "reservation" | "cancellation" | "inquiry" | "subscriber"; message: string; time: string };

const ICONS = {
  reservation: { Icon: CalendarPlus, className: "bg-green-500/15 text-green-500" },
  cancellation: { Icon: CalendarX, className: "bg-error/15 text-error" },
  inquiry: { Icon: MessageSquarePlus, className: "bg-gold/15 text-gold-text" },
  subscriber: { Icon: Mail, className: "bg-blue-500/15 text-blue-500" },
};

export default function ActivityFeed({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">No recent activity yet.</div>;
  }

  return (
    <div className="space-y-1">
      {activity.map((a) => {
        const { Icon, className } = ICONS[a.type];
        return (
          <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-cream-input/50">
            <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${className}`}>
              <Icon size={15} strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-heading">{a.message}</div>
              <div className="text-[11px] text-muted">{formatDistanceToNow(new Date(a.time), { addSuffix: true })}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
