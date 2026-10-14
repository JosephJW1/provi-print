import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { DataTable, type Column } from '../components/DataTable';

interface ProductVariant {
  id: number;
  description: string;
  price_pence: number;
}

const ProductEditPage: React.FC = () => {
  const { id } = useParams(); // If ID exists, we are editing. If undefined, we are creating.
  const navigate = useNavigate();
  
  // Product State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  
  // Variant Form State
  const [variantDesc, setVariantDesc] = useState('');
  const [variantPrice, setVariantPrice] = useState<number | ''>('');

  const fetchProductData = async () => {
    if (!id) return;
    try {
      const res = await api.get('/products');
      const product = res.data.find((p: any) => p.id.toString() === id);
      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        // Sequelize includes associated models using the pluralized model name by default
        setVariants(product.ProductVariants || []); 
      }
    } catch (err) {
      console.error("Failed to fetch product", err);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (id) {
        await api.put(`/products/${id}`, { name, description });
      } else {
        await api.post('/products', { name, description });
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
    }
  };

  // --- Variant Handlers ---
  const openVariantModal = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant);
      setVariantDesc(variant.description);
      setVariantPrice(variant.price_pence);
    } else {
      setEditingVariant(null);
      setVariantDesc('');
      setVariantPrice('');
    }
    setShowVariantModal(true);
  };

  const handleSaveVariant = async () => {
    if (!variantDesc || variantPrice === '') return alert("Please fill out all fields.");
    
    try {
      if (editingVariant) {
        await api.put(`/variants/${editingVariant.id}`, { 
          description: variantDesc, 
          price_pence: Number(variantPrice) 
        });
      } else {
        await api.post('/variants/bulk', {
          ProductId: id,
          variants: [{ description: variantDesc, price_pence: Number(variantPrice) }]
        });
      }
      setShowVariantModal(false);
      fetchProductData(); // Refresh variants list
    } catch (error) {
      console.error("Error saving variant:", error);
      alert("Failed to save variant.");
    }
  };

  const handleDeleteVariant = async (variant: any) => {
    if (window.confirm(`Are you sure you want to delete this variant?`)) {
      try {
        await api.delete(`/variants/${variant.id}`);
        fetchProductData(); // Refresh variants list
      } catch (error) {
        alert("Failed to delete variant.");
      }
    }
  };

  // Format data for the DataTable to display prices nicely
  const tableData = variants.map(v => ({
    ...v,
    formatted_price: `£${(v.price_pence / 100).toFixed(2)}`
  }));

  const variantColumns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description' },
    { key: 'formatted_price', label: 'Price' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Product Details Section */}
      <div>
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="text-slate-500 hover:text-slate-800"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {id ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Framed Art Print"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none h-32"
              placeholder="Base description of the physical product..."
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              {id ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Product Variants Section - Only show if editing an existing product */}
      {id && (
        <DataTable 
          title="Product Variants"
          data={tableData} 
          columns={variantColumns} 
          onAdd={() => openVariantModal()}
          onEdit={(variant) => openVariantModal(variant as ProductVariant)}
          onDelete={handleDeleteVariant}
          addLabel="New Variant"
        />
      )}

      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingVariant ? 'Edit Variant' : 'Add Variant'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={variantDesc}
                  onChange={(e) => setVariantDesc(e.target.value)}
                  placeholder="e.g., A4 Size"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (in pence)</label>
                <input
                  type="number"
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g., 1500 for £15.00"
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowVariantModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVariant}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
              >
                Save Variant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEditPage;