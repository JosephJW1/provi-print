import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { DataTable, type Column } from '../components/DataTable';

interface Product {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns: Column<Product>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'description', label: 'Description' },
  ];

  const handleEdit = (product: Product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await api.delete(`/products/${product.id}`);
        fetchProducts(); // Refresh list after deletion
      } catch (error) {
        alert("Failed to delete product.");
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">Products</h1>
        <p className="text-slate-500 dark:text-neutral-400">
          Manage base products (e.g., Framed Art, Canvas).
        </p>
      </div>

      <DataTable
        title="Product Inventory"
        data={products}
        columns={columns}
        onAdd={() => navigate('/products/new')}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addLabel="New Product"
      />
    </div>
  );
};

export default ProductsPage;