"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, X, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ดึงข้อมูลแจ้งเตือน
  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }

  // เรียกใช้ครั้งแรกและตั้งค่า Polling ทุก 30 วินาที
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 วินาที

    return () => clearInterval(interval);
  }, []);

  // ปิดเมนูดรอปดาวน์เมื่อคลิกนอกกรอบ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ทำเครื่องหมายอ่านแล้วทั้งหมด
  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  }

  // ทำเครื่องหมายอ่านแล้วทีละรายการ
  async function handleMarkAsRead(id: string, linkUrl: string | null) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setIsOpen(false);
      if (linkUrl) {
        router.push(linkUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  }

  // ลบการแจ้งเตือน
  async function handleDeleteNotification(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ปุ่มกดเปิดกระดิ่งแจ้งเตือน */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-650 hover:text-slate-800 shadow-sm"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* เมนูรายการแจ้งเตือน Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              🔔 การแจ้งเตือนล่าสุด
              {unreadCount > 0 && (
                <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  ใหม่ {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-brand-650 hover:text-brand-800 flex items-center gap-0.5 hover:underline transition"
              >
                <CheckCheck className="w-3.5 h-3.5" /> อ่านแล้วทั้งหมด
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50 mt-1 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-slate-400 text-xs">คุณยังไม่มีการแจ้งเตือนในขณะนี้</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.linkUrl)}
                  className={`group relative flex items-start gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer ${
                    !n.isRead ? "bg-brand-50/15" : ""
                  }`}
                >
                  {/* Unread indicator */}
                  {!n.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-650" />
                  )}

                  <div className="flex-1 text-left pl-1.5 pr-6">
                    <span className={`block text-xs font-bold leading-tight ${!n.isRead ? "text-slate-900" : "text-slate-700"}`}>
                      {n.title}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-normal">
                      {n.message}
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1 font-medium">
                      {new Date(n.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })} น.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteNotification(e, n.id)}
                      className="text-slate-400 hover:text-rose-600 rounded-lg p-1 hover:bg-white border border-slate-100 shadow-sm transition"
                      title="ลบการแจ้งเตือน"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
