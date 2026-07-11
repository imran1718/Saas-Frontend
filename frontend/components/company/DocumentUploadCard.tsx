import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useFileUpload } from '../../lib/useFileUpload';
import { FileText, Trash2, UploadCloud, CheckCircle, Clock } from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export const DocumentUploadCard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docType, setDocType] = useState('pan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { uploadFile, isUploading, uploadProgress } = useFileUpload();

  const fetchDocuments = async () => {
    try {
      const { data } = await apiClient.get('/company/profile/documents');
      setDocuments(data.data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setError('');
      await uploadFile('/company/profile/documents', file, 'document', { document_type: docType });
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiClient.delete(`/company/profile/documents/${id}`);
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

  return (
    <div className="bg-white dark:bg-[#131620] p-6 rounded-xl shadow-sm border border-slate-100 dark:border-white/[0.06] max-w-2xl mt-6">
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">KYC Documents</h3>
      
      {error && <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-900/30 mb-4">{error}</div>}

      <div className="flex items-center space-x-4 mb-6">
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="block rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none">
          <option value="pan" className="dark:bg-[#131620]">PAN Card</option>
          <option value="gst_certificate" className="dark:bg-[#131620]">GST Certificate</option>
          <option value="address_proof" className="dark:bg-[#131620]">Address Proof</option>
          <option value="other" className="dark:bg-[#131620]">Other</option>
        </select>
        
        <div className="relative">
          <label className={`flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UploadCloud className="w-4 h-4 mr-2" />
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Document'}
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p> : documents.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-lg">No documents uploaded yet.</p>
        ) : (
          documents.map(doc => {
            const fileUrl = doc.file_url.startsWith('http') ? doc.file_url : `${backendUrl}${doc.file_url}`;
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/[0.06] rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <div>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      {doc.file_name}
                    </a>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="uppercase">{doc.document_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="flex items-center">{getStatusIcon(doc.status)} <span className="ml-1 capitalize">{doc.status}</span></span>
                    </div>
                  </div>
                </div>
                {doc.status !== 'verified' && (
                  <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
