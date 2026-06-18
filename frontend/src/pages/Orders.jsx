import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import { useApp } from '../context/AppContext';

const PAGE_SIZE = 10;

const emptyLine = { product_id: '', quantity: '' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { showToast } = useApp();

  const searchCustomers = useCallback(async (query) => {
    const res = await api.customers.search(query);
    return res.data.items;
  }, []);

  const resolveCustomer = useCallback(async (id) => {
    const res = await api.customers.get(id);
    return res.data;
  }, []);

  const searchProducts = useCallback(async (query) => {
    const res = await api.products.search(query);
    return res.data.items;
  }, []);

  const resolveProduct = useCallback(async (id) => {
    const res = await api.products.get(id);
    return res.data;
  }, []);

  const fetchOrders = useCallback(async (pageNum) => {
    try {
      const res = await api.orders.list({ page: pageNum, page_size: PAGE_SIZE });
      setOrders(res.data.items);
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
    fetchOrders(page);
  }, [page, fetchOrders]);

  const addLine = () => setLines([...lines, { ...emptyLine }]);

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const validate = () => {
    const errs = {};
    if (!customerId) errs.customer = 'Select a customer';
    const lineErrors = lines.map((line) => {
      const le = {};
      if (!line.product_id) le.product = 'Select a product';
      if (!line.quantity || Number(line.quantity) <= 0) le.quantity = 'Quantity must be > 0';
      return le;
    });
    if (lineErrors.some((le) => Object.keys(le).length > 0)) errs.lines = lineErrors;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.orders.create({
        customer_id: Number(customerId),
        items: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
        })),
      });
      showToast('Order created successfully');
      setModalOpen(false);
      setCustomerId('');
      setLines([{ ...emptyLine }]);
      setErrors({});
      setPage(1);
      fetchOrders(1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel and delete this order? Stock will be restored.')) return;
    try {
      await api.orders.delete(id);
      showToast('Order cancelled successfully');
      const nextPage = orders.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchOrders(nextPage);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCustomerId('');
            setLines([{ ...emptyLine }]);
            setErrors({});
            setModalOpen(true);
          }}
        >
          + Create Order
        </button>
      </div>

      {total === 0 ? (
        <div className="empty-state card">No orders yet. Create your first order.</div>
      ) : (
        <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name || `Customer #${order.customer_id}`}</td>
                  <td>${Number(order.total_amount).toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success">{order.status}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(order.id)}>
                        Cancel
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
        <Modal title="Create Order" onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit}>
            <FormField label="Customer" required error={errors.customer}>
              <SearchableSelect
                value={customerId}
                onChange={setCustomerId}
                onSearch={searchCustomers}
                resolveOption={resolveCustomer}
                placeholder="Search by email or phone..."
                hintMessage="Type email or phone to search customers"
                emptyMessage="No customers found"
                getValue={(c) => c.id}
                getLabel={(c) => `${c.full_name} — ${c.email}`}
                renderOption={(c) => (
                  <>
                    <div className="searchable-select-option-title">{c.full_name}</div>
                    <div className="searchable-select-option-meta">
                      {c.email} · {c.phone}
                    </div>
                  </>
                )}
              />
            </FormField>

            <h3 className="section-title" style={{ marginTop: '1rem' }}>
              Order Items
            </h3>
            {lines.map((line, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 2 }}>
                  <FormField label="Product" required error={errors.lines?.[index]?.product}>
                    <SearchableSelect
                      value={line.product_id}
                      onChange={(value) => updateLine(index, 'product_id', value)}
                      onSearch={searchProducts}
                      resolveOption={resolveProduct}
                      placeholder="Search by name or SKU..."
                      hintMessage="Type product name or SKU to search"
                      emptyMessage="No products found"
                      getValue={(p) => p.id}
                      getLabel={(p) => `${p.name} (${p.sku})`}
                      renderOption={(p) => (
                        <>
                          <div className="searchable-select-option-title">{p.name}</div>
                          <div className="searchable-select-option-meta">
                            SKU: {p.sku} · Stock: {p.quantity_in_stock} · ${Number(p.price).toFixed(2)}
                          </div>
                        </>
                      )}
                    />
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="Quantity" required error={errors.lines?.[index]?.quantity}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    />
                  </FormField>
                </div>
                {lines.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: '0.25rem' }} onClick={() => removeLine(index)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
              + Add Item
            </button>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
