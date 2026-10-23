import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import type { DesignRecord, DesignTown } from './DesignsPage';

const DesignEditPage: React.FC = () => {
  const { id } = useParams(); // If ID exists, we are editing. If undefined, we are creating.
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTownIds, setSelectedTownIds] = useState<number[]>([]);
  const [availableTowns, setAvailableTowns] = useState<DesignTown[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load available towns for the DesignTowns association
    api
      .get<DesignTown[]>('/towns')
      .then((res) => setAvailableTowns(res.data))
      .catch((err) => console.error('Failed to fetch towns', err));

    // If editing, load the existing design
    if (id) {
      api
        .get<DesignRecord>(`/designs/${id}`)
        .then((res) => {
          const design = res.data;
          setTitle(design.title);
          setDescription(design.description || '');
          setCurrentImageUrl(design.image_url);
          if (design.Towns) {
            setSelectedTownIds(design.Towns.map((t) => t.id));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch design', err);
          setError('Failed to load design details.');
        });
    }
  }, [id]);

  const toggleTownSelection = (townId: number) => {
    setSelectedTownIds((prev) =>
      prev.includes(townId) ? prev.filter((item) => item !== townId) : [...prev, townId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id && !masterFile) {
      setError('Please select a high-resolution master image file.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('townIds', JSON.stringify(selectedTownIds));

      if (masterFile) {
        formData.append('masterImage', masterFile);
      }

      if (id) {
        await api.put(`/designs/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/designs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/designs');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Failed to save design');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/designs')}
            className="text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">
            {id ? 'Edit Design' : 'Add New Design'}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-neutral-800 space-y-5 transition-colors"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
              Design Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 border border-slate-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-neutral-500 outline-none transition-colors"
              placeholder="e.g., The Golden Gates"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 border border-slate-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-neutral-500 outline-none h-28 transition-colors"
              placeholder="Description of the artwork design..."
            />
          </div>

          {/* Associated Towns (DesignTowns many-to-many) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">
              Associated Towns
            </label>
            {availableTowns.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                No towns found in database.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {availableTowns.map((town) => {
                  const isChecked = selectedTownIds.includes(town.id);
                  return (
                    <label
                      key={town.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-neutral-800 dark:border-neutral-400 dark:text-neutral-100'
                          : 'bg-white dark:bg-neutral-800/50 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTownSelection(town.id)}
                        className="rounded"
                      />
                      <span>{town.townName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Image File Upload (Sharp + R2 Dual-Bucket) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
              {id ? 'Replace High-Res Master Image (Optional)' : 'High-Res Master Image *'}
            </label>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2">
              Uploads the 300 DPI master to your private R2 bucket and stores the watermarked
              800×1130 WebP preview URL in <code>Design.image_url</code>.
            </p>

            {currentImageUrl && !masterFile && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={currentImageUrl}
                  alt={title}
                  className="w-16 h-20 object-cover rounded border border-slate-200 dark:border-neutral-700"
                />
                <span className="text-xs text-slate-500 dark:text-neutral-400 break-all">
                  Current <code>image_url</code>: {currentImageUrl}
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/tiff"
              onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
              required={!id}
              className="block w-full text-sm text-slate-600 dark:text-neutral-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
            />
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 dark:bg-neutral-200 dark:hover:bg-white text-white dark:text-neutral-900 px-6 py-2 rounded font-medium transition-colors"
            >
              {isSubmitting
                ? 'Processing & Uploading to R2...'
                : id
                ? 'Save Changes'
                : 'Create Design'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DesignEditPage;
