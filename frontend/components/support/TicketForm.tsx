'use client';

import React, { useState } from 'react';
import { Paperclip, Loader2, ArrowLeft, Send, Check } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Attachment {
  file_name: string;
  file_url: string;
  file_size_bytes: number;
}

export default function TicketForm({ onBack }: { onBack: () => void }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('shipment_issue');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');
  const [relatedOrderId, setRelatedOrderId] = useState('');
  const [relatedShipmentId, setRelatedShipmentId] = useState('');

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      // Endpoint to upload ticket attachment
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length < 10) {
      toast.error('Message details must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        subject,
        category,
        priority,
        message,
        attachments,
      };

      if (relatedOrderId.trim()) payload.related_order_id = relatedOrderId.trim();
      if (relatedShipmentId.trim()) payload.related_shipment_id = relatedShipmentId.trim();

      const response = await apiClient.post('/support/tickets', payload);

      if (response.data.success) {
        toast.success(`Support Ticket #${response.data.data.ticket_number} created successfully.`);
        onBack();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-2xl mx-auto">
      <div className="p-6 border-b border-gray-50 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-50 border border-gray-200/80 rounded-xl text-gray-500 transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-black text-gray-900">Raise New Support Ticket</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Our dispatch support staff will review this request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            Subject Heading
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. NDR dispute for AWB-991823"
            className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="shipment_issue">Shipment Delivery Issue</option>
              <option value="billing">Billing & Finance</option>
              <option value="technical">Technical Glitch</option>
              <option value="account">Account & Subscriptions</option>
              <option value="other">Other Query</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Priority Urgency
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="low">Low (72 hr SLA)</option>
              <option value="medium">Medium (24 hr SLA)</option>
              <option value="high">High (8 hr SLA)</option>
              <option value="urgent">Urgent (2 hr SLA)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Linked Order ID (Optional)
            </label>
            <input
              type="text"
              value={relatedOrderId}
              onChange={(e) => setRelatedOrderId(e.target.value)}
              placeholder="e.g. UUID order reference"
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
              Linked Shipment ID (Optional)
            </label>
            <input
              type="text"
              value={relatedShipmentId}
              onChange={(e) => setRelatedShipmentId(e.target.value)}
              placeholder="e.g. UUID shipment reference"
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            Detailed Explanation
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide all background info, shipment identifiers, or transaction timestamps..."
            className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Upload attachment area */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Attachments (Max 5 files, up to 5MB each)
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 border border-dashed border-gray-300 hover:border-blue-500 cursor-pointer rounded-2xl px-4 py-3 text-xs text-gray-500 transition bg-gray-50/50">
              <Paperclip className="h-4 w-4 text-gray-400" />
              <span>{uploading ? 'Uploading File...' : 'Attach Screen Grab'}</span>
              <input
                type="file"
                className="hidden"
                disabled={uploading || attachments.length >= 5}
                onChange={handleFileUpload}
              />
            </label>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-xl flex items-center space-x-1 border border-blue-100 font-medium">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                  <span className="truncate max-w-[150px]">{att.file_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Raise Support Ticket</span>
          </button>
        </div>
      </form>
    </div>
  );
}
