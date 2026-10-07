import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useNotifications } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

/** In-app notifications: new orders for farmers, status changes and cancellations for buyers, reviews for farmers. */
const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const { data } = useNotifications(true);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({ mutationFn: (id: number) => api.patch(`/notifications/${id}/read`, {}), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => api.post("/notifications/read-all"), onSuccess: refresh });

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  const open_ = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    // Links are created by our own SQL functions, but only follow in-app paths regardless.
    if (n.link && /^\/(?![/\\])/.test(n.link)) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-paper-sunk" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="figure absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0" aria-label="Notifications">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <h2 className="text-sm font-bold">Notifications</h2>
          {unread > 0 && (
            <button className="text-xs font-semibold text-field hover:underline" onClick={() => markAll.mutate()}>Mark all read</button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <BellOff className="mb-2 h-8 w-8 text-rule-strong" strokeWidth={1.5} />
            <p className="text-sm text-ink-soft">You're all caught up. We'll tell you when an order moves.</p>
          </div>
        ) : (
          <ul className="max-h-96 divide-y divide-rule overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => open_(n)} className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-sunk", !n.read && "bg-field-wash/60")}>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-field")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className={cn("block text-sm", n.read ? "text-ink-soft" : "font-semibold")}>{n.title}</span>
                    {n.body && <span className="block text-[13px] text-ink-soft">{n.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-ink-soft">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
