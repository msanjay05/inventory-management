import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import CountryCodeSelect from '../components/CountryCodeSelect';
import FormField from '../components/FormField';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useApp } from '../context/AppContext';

const PAGE_SIZE = 10;

const emptyForm = { full_name: '', email: '', country_code: '+1', phone_number: '' };

function validateForm(form) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = 'Full name is required';
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email format';
  }
  if (!form.country_code) {
    errors.country_code = 'Country code is required';
  }
  if (!form.phone_number.trim()) {
    errors.phone_number = 'Phone number is required';
  } else if (!/^\d[\d\s-]{4,}$/.test(form.phone_number.trim())) {
    errors.phone_number = 'Enter a valid phone number';
  }
  return errors;
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { showToast } = useApp();

  const fetchCustomers = useCallback(async (pageNum) => {
    try {
      const res = await api.customers.list({ page: pageNum, page_size: PAGE_SIZE });
      setCustomers(res.data.items);
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
    fetchCustomers(page);
  }, [page, fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.customers.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        country_code: form.country_code.trim(),
        phone_number: form.phone_number.trim(),
      });
      showToast('Customer created successfully');
      setModalOpen(false);
      setForm(emptyForm);
      setPage(1);
      fetchCustomers(1);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.customers.delete(id);
      showToast('Customer deleted successfully');
      const nextPage = customers.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchCustomers(nextPage);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="loading">Loading customers...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setForm(emptyForm);
            setErrors({});
            setModalOpen(true);
          }}
        >
          + Add Customer
        </button>
      </div>

      {total === 0 ? (
        <div className="empty-state card">No customers yet. Add your first customer.</div>
      ) : (
        <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(customer.id)}>
                      Delete
                    </button>
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
        <Modal title="Add Customer" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <FormField label="Full Name" required error={errors.full_name}>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </FormField>
            <FormField label="Email" required error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </FormField>
            <FormField
              label="Phone"
              required
              error={errors.country_code || errors.phone_number}
            >
              <div className="phone-input-row">
                <CountryCodeSelect
                  value={form.country_code}
                  onChange={(country_code) => setForm({ ...form, country_code })}
                />
                <input
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="555-010-1234"
                />
              </div>
            </FormField>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
