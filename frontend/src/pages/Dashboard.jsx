import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const { showToast } = useApp();

  useEffect(() => {
    api.dashboard
      .summary()
      .then((res) => setSummary(res.data))
      .catch((err) => showToast(getErrorMessage(err), 'error'));
  }, [showToast]);

  if (!summary) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{summary.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{summary.total_customers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{summary.total_orders}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Low Stock Products</h2>
        {summary.low_stock_products.length === 0 ? (
          <p className="empty-state">All products are well stocked.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-warning">{product.quantity_in_stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
