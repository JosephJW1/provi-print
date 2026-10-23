import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export interface DesignTown {
  id: number;
  townName: string;
}

export interface DesignRecord {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  createdAt: string;
  Towns?: DesignTown[];
}

const DesignsPage: React.FC = () => {
  const [designs, setDesigns] = useState<DesignRecord[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchDesigns = async () => {
    try {
      const response = await api.get<DesignRecord[]>('/designs');
      setDesigns(response.data);
    } catch (error) {
      console.error('Failed to fetch designs', error);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleEdit = (design: DesignRecord) => {
    navigate(`/designs/edit/${design.id}`);
  };

  const handleDelete = async (design: DesignRecord) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${design.title}"? This will also delete its preview and master files from Cloudflare R2.`
      )
    ) {
      try {
        await api.delete(`/designs/${design.id}`);
        fetchDesigns();
      } catch (error) {
        alert('Failed to delete design.');
      }
    }
  };

  const handleDownloadMaster = async (design: DesignRecord) => {
    setDownloadingId(design.id);
    try {
      const response = await api.get<{ downloadUrl: string }>(
        `/designs/${design.id}/master-download`
      );
      window.open(response.data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      alert(errorObj.response?.data?.error || 'Failed to generate master download URL.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">Designs</h1>
        <p className="text-slate-500 dark:text-neutral-400">
          Manage commissioned artwork designs printed onto products and linked to towns.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-lg border border-slate-200 dark:border-neutral-800 transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center bg-slate-50 dark:bg-neutral-800/60 rounded-t-lg">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-neutral-100">
            Design Inventory
          </h2>
          <button
            onClick={() => navigate('/designs/new')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-neutral-200 dark:hover:bg-white dark:text-neutral-900 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            + New Design
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/40 text-slate-600 dark:text-neutral-400 text-sm border-b border-slate-200 dark:border-neutral-800">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Preview</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Towns</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {designs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500 dark:text-neutral-500"
                  >
                    No designs available.
                  </td>
                </tr>
              ) : (
                designs.map((design) => (
                  <tr
                    key={design.id}
                    className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-neutral-300">
                      {design.id}
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={design.image_url}
                        alt={design.title}
                        className="w-12 h-16 object-cover rounded border border-slate-200 dark:border-neutral-700 bg-slate-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://placehold.co/120x160/2c3e50/e9c46a?text=Design';
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-neutral-200">
                      {design.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-neutral-300 max-w-xs truncate">
                      {design.description || ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-neutral-300">
                      {design.Towns && design.Towns.length > 0
                        ? design.Towns.map((t) => t.townName).join(', ')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadMaster(design)}
                        disabled={downloadingId === design.id}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium disabled:opacity-50"
                      >
                        {downloadingId === design.id ? 'Signing...' : 'Download Master'}
                      </button>
                      <button
                        onClick={() => handleEdit(design)}
                        className="text-blue-600 hover:text-blue-800 dark:text-neutral-200 dark:hover:text-white font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(design)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DesignsPage;
