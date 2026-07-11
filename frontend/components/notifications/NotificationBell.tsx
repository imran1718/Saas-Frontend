'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../lib/useNotifications';
import { Bell, CheckSquare, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all duration-200 focus:outline-none"
        aria-label="Toggle notifications dropdown"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f1117] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131620]/95 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-all outline-none"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto py-2 divide-y divide-slate-100 dark:divide-white/[0.04] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-8 h-8 text-slate-400 dark:text-slate-650 mb-2 stroke-[1.5]" />
                <p className="text-xs text-slate-650 dark:text-slate-400 font-medium">All caught up!</p>
                <p className="text-[10px] text-slate-500 mt-0.5">No new notifications to display.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`flex flex-col gap-1 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    notif.is_read ? 'hover:bg-slate-50 dark:hover:bg-white/[0.02]' : 'bg-indigo-500/5 hover:bg-indigo-500/10 border-l-2 border-indigo-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-semibold ${notif.is_read ? 'text-slate-600 dark:text-slate-350' : 'text-slate-900 dark:text-white'}`}>
                      {notif.title}
                    </span>
                    {!notif.is_read && (
                      <span className="h-1.5 w-1.5 mt-1 rounded-full bg-indigo-550 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-light">
                    {notif.body}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-450 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {notif.link_url && (
                      <Link
                        href={notif.link_url}
                        className="flex items-center gap-1 text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-all"
                      >
                        Details
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
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
