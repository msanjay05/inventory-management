import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import { useApp } from '../context/AppContext';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const { showToast } = useApp();

  useEffect(() => {
    api.orders
      .get(id)
      .then((res) => setOrder(res.data))
      .catch((err) => showToast(getErrorMessage(err), 'error'));
  }, [id, showToast]);

  if (!order) {
    return <div className="loading">Loading order...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Order #{order.id}</h1>
        <Link to="/orders" className="btn btn-secondary">
          ← Back to Orders
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <div className="stat-label">Customer</div>
            <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
              {order.customer_name || `Customer #${order.customer_id}`}
            </div>
          </div>
          <div>
            <div className="stat-label">Status</div>
            <div style={{ marginTop: '0.25rem' }}>
              <span className="badge badge-success">{order.status}</span>
            </div>
          </div>
          <div>
            <div className="stat-label">Total Amount</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '0.25rem' }}>
              ${Number(order.total_amount).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Order Items</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name || `Product #${item.product_id}`}</td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
