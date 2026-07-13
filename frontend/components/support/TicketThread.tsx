'use client';

import React, { useState } from 'react';
import { 
  Paperclip, 
  Loader2, 
  Send, 
  User, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';

interface Attachment {
  file_name: string;
  file_url: string;
  file_size_bytes: number;
}

interface Message {
  id: string;
  sender_type: 'tenant_user' | 'platform_admin';
  sender_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  attachments?: Attachment[];
}

interface TicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  category: 'billing' | 'technical' | 'shipment_issue' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_tenant' | 'resolved' | 'closed';
  created_at: string;
  messages: Message[];
  related_order_id?: string;
  related_shipment_id?: string;
}

export default function TicketThread({ 
  ticket, 
  onRefresh 
}: { 
  ticket: TicketDetail; 
  onRefresh: () => void 
}) {
  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the maximum limit of 5MB.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/support/tickets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setAttachments([...attachments, response.data.data]);
        toast.success(`File "${file.name}" uploaded successfully.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (replyMessage.trim().length < 10) {
      toast.error('Reply message must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(`/support/tickets/${ticket.id}/reply`, {
        message: replyMessage,
        attachments,
      });

      if (response.data.success) {
        setReplyMessage('');
        setAttachments([]);
        toast.success('Reply submitted successfully.');
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    setClosing(true);
    try {
      const response = await apiClient.put(`/support/tickets/${ticket.id}/close`);
      if (response.data.success) {
        toast.success('Ticket closed successfully.');
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to close ticket.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      
      {/* Discussion Thread */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
          
          {/* Messages Queue */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/20">
            {ticket.messages.map((msg) => {
              const isAdmin = msg.sender_type === 'platform_admin';
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-3.5 max-w-[85%] ${
                    isAdmin ? '' : 'ml-auto flex-row-reverse space-x-reverse'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                    isAdmin ? 'bg-amber-500' : 'bg-blue-600'
                  }`}>
                    {isAdmin ? <ShieldAlert className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl border text-xs shadow-sm ${
                      isAdmin 
                        ? 'bg-white border-gray-100 text-gray-800' 
                        : 'bg-blue-600 border-blue-600 text-white'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed divide-y divide-gray-100 border-gray-100/50 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <a 
                              key={idx}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-between text-[10px] font-bold py-1 hover:underline ${
                                isAdmin ? 'text-blue-600' : 'text-blue-100'
                              }`}
                            >
                              <span className="truncate max-w-[120px]">{att.file_name}</span>
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[9px] font-bold text-gray-400 block px-2 uppercase tracking-wide text-right">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thread Form Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            {ticket.status === 'closed' ? (
              <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-150 text-gray-500 text-xs rounded-2xl font-bold space-x-1.5">
                <Lock className="h-4 w-4" />
                <span>This ticket is closed and cannot receive replies.</span>
              </div>
            ) : (
              <form onSubmit={handleReply} className="space-y-3">
                
                {ticket.status === 'resolved' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-semibold">
                      This ticket has been resolved. You can close this ticket, or reply to reopen it.
                    </span>
                    <button
                      type="button"
                      onClick={handleCloseTicket}
                      disabled={closing}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-3.5 rounded-xl shadow transition"
                    >
                      {closing ? 'Closing...' : 'Close Ticket'}
                    </button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    placeholder={
                      ticket.status === 'resolved' 
                        ? 'Type here to dispute and reopen ticket...' 
                        : 'Reply to support staff thread...'
                    }
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-4 pr-12 py-3 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <div className="absolute right-3.5 bottom-3.5 flex items-center space-x-2">
                    <label className="p-1 hover:bg-gray-200/50 rounded-lg cursor-pointer text-gray-400 hover:text-gray-600 transition">
                      <Paperclip className="h-4 w-4" />
                      <input 
                        type="file" 
                        className="hidden" 
                        disabled={uploading || attachments.length >= 5} 
                        onChange={handleFileUpload}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition active:scale-95 shadow-md"
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="bg-blue-50 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-lg flex items-center space-x-1 border border-blue-100 font-medium">
                        <Check className="h-3 w-3 text-blue-600" />
                        <span className="truncate max-w-[120px]">{att.file_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Sidebar Context Metadata */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Ticket Details</h3>
          
          <div className="space-y-3 divide-y divide-gray-50 text-xs">
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400 font-medium">Ticket Number</span>
              <span className="font-bold text-gray-900">#{ticket.ticket_number}</span>
            </div>
            
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400 font-medium">Status</span>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-gray-400 font-medium">Priority</span>
              <TicketPriorityBadge priority={ticket.priority} />
            </div>

            <div className="flex justify-between py-1.5 text-capitalize">
              <span className="text-gray-400 font-medium">Category</span>
              <span className="font-semibold text-gray-700">{ticket.category.replace(/_/g, ' ')}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-gray-400 font-medium">Raised On</span>
              <span className="font-semibold text-gray-700">{new Date(ticket.created_at).toLocaleString()}</span>
            </div>

            {ticket.related_order_id && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 font-medium">Linked Order</span>
                <span className="font-mono text-gray-600 font-bold text-[10px]">{ticket.related_order_id}</span>
              </div>
            )}

            {ticket.related_shipment_id && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 font-medium">Linked Shipment</span>
                <span className="font-mono text-gray-600 font-bold text-[10px]">{ticket.related_shipment_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
