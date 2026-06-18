import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useApp } from '../context/AppContext';

const PAGE_SIZE = 10;

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' };

const CHANGE_LABELS = {
  order_placed: 'Order Placed',
  order_cancelled: 'Order Cancelled',
  manual_add: 'Manual Add',
  initial_stock: 'Initial Stock',
};

function formatChangeType(type) {
  return CHANGE_LABELS[type] || type;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function validateForm(form, isEditing) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!isEditing) {
    if (!form.sku.trim()) errors.sku = 'SKU is required';
    if (form.quantity_in_stock === '' || Number(form.quantity_in_stock) < 0) {
      errors.quantity_in_stock = 'Quantity must be 0 or more';
    }
  }
  if (!form.price || Number(form.price) <= 0) errors.price = 'Price must be greater than 0';
  return errors;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockErrors, setStockErrors] = useState({});
  const [addingStock, setAddingStock] = useState(false);
  const [logsProduct, setLogsProduct] = useState(null);
  const [stockLogs, setStockLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { showToast } = useApp();

  const fetchProducts = useCallback(async (pageNum) => {
    try {
      const res = await api.products.list({ page: pageNum, page_size: PAGE_SIZE });
      setProducts(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
      setPage(res.data.page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setLoading(true);
    fetchProducts(page);
  }, [page, fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    });
    setErrors({});
    setModalOpen(true);
  };

  const openAddStock = (product) => {
    setStockProduct(product);
    setStockQuantity('');
    setStockErrors({});
  };

  const closeAddStock = () => {
    setStockProduct(null);
    setStockQuantity('');
    setStockErrors({});
  };

  const fetchStockLogs = useCallback(async (productId) => {
    setLogsLoading(true);
    try {
      const res = await api.products.stockLogs(productId);
      setStockLogs(res.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setStockLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [showToast]);

  const openStockLogs = (product) => {
    setLogsProduct(product);
    setStockLogs([]);
    fetchStockLogs(product.id);
  };

  const closeStockLogs = () => {
    setLogsProduct(null);
    setStockLogs([]);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const quantity = Number(stockQuantity);
    if (!quantity || quantity <= 0) {
      setStockErrors({ quantity: 'Enter a quantity greater than 0' });
      return;
    }

    setAddingStock(true);
    try {
      await api.products.addStock(stockProduct.id, quantity);
      showToast(`Added ${quantity} units to ${stockProduct.name}`);
      if (logsProduct?.id === stockProduct.id) {
        fetchStockLogs(stockProduct.id);
      }
      closeAddStock();
      fetchProducts(page);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setAddingStock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editingId);
    const validationErrors = validateForm(form, isEditing);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.products.update(editingId, {
          name: form.name.trim(),
          price: Number(form.price),
        });
        showToast('Product updated successfully');
      } else {
        await api.products.create({
          name: form.name.trim(),
          sku: form.sku.trim(),
          price: Number(form.price),
          quantity_in_stock: Number(form.quantity_in_stock),
        });
        showToast('Product created successfully');
      }
      setModalOpen(false);
      if (isEditing) {
        fetchProducts(page);
      } else {
        setPage(1);
        fetchProducts(1);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.products.delete(id);
      showToast('Product deleted successfully');
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchProducts(nextPage);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  const isEditing = Boolean(editingId);

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Product
        </button>
      </div>

      {total === 0 ? (
        <div className="empty-state card">No products yet. Add your first product.</div>
      ) : (
        <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>
                    {product.quantity_in_stock <= 10 ? (
                      <span className="low-stock">{product.quantity_in_stock}</span>
                    ) : (
                      product.quantity_in_stock
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(product)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openAddStock(product)}>
                        Add Stock
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openStockLogs(product)}>
                        Stock Logs
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
        </>
      )}

      {modalOpen && (
        <Modal title={isEditing ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <FormField label="Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product name"
              />
            </FormField>
            <FormField label="SKU" required error={errors.sku}>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU-001"
                disabled={isEditing}
              />
            </FormField>
            <FormField label="Price" required error={errors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Quantity in Stock" required={!isEditing} error={errors.quantity_in_stock}>
              <input
                type="number"
                min="0"
                value={form.quantity_in_stock}
                onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
                placeholder="0"
                disabled={isEditing}
              />
            </FormField>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {stockProduct && (
        <Modal title={`Add Stock — ${stockProduct.name}`} onClose={closeAddStock}>
          <form onSubmit={handleAddStock}>
            <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Current stock: <strong>{stockProduct.quantity_in_stock}</strong>
            </p>
            <FormField label="Units to Add" required error={stockErrors.quantity}>
              <input
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Enter quantity"
                autoFocus
              />
            </FormField>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeAddStock}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={addingStock}>
                {addingStock ? 'Adding...' : 'Add Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {logsProduct && (
        <Modal title={`Stock Logs — ${logsProduct.name}`} onClose={closeStockLogs} wide>
          {logsLoading ? (
            <div className="loading">Loading stock logs...</div>
          ) : stockLogs.length === 0 ? (
            <div className="empty-state">No stock changes recorded yet.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Change</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Order</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>{formatChangeType(log.change_type)}</td>
                      <td>
                        <span className={log.quantity_change >= 0 ? 'stock-change-positive' : 'stock-change-negative'}>
                          {log.quantity_change >= 0 ? `+${log.quantity_change}` : log.quantity_change}
                        </span>
                      </td>
                      <td>{log.quantity_before}</td>
                      <td>{log.quantity_after}</td>
                      <td>{log.order_id ? `#${log.order_id}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
