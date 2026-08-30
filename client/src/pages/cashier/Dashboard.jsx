import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import API from '../../utils/api';

const menuItems = [
  { path: '/cashier', label: 'Dashboard', icon: '📊' },
  { path: '/cashier/payments', label: 'Payments', icon: '💰' },
  { path: '/cashier/expenses', label: 'Expenses', icon: '💸' },
  { path: '/cashier/petty-cash', label: 'Petty Cash', icon: '💵' },
  { path: '/cashier/debts', label: 'Outstanding Debts', icon: '📋' },
];

// ─── CASHIER HOME ─────────────────────────────────────────────
const CashierHome = () => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, exp, pay] = await Promise.all([
          API.get('/cashier/invoices'),
          API.get('/cashier/expenses'),
          API.get('/cashier/payments'),
        ]);
        setInvoices(inv.data.invoices || []);
        setExpenses(exp.data.expenses || []);
        setPayments(pay.data.payments || []);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => p.created_at && p.created_at.startsWith(todayStr));
  const todayExpenses = expenses.filter((e) => e.expense_date && e.expense_date.startsWith(todayStr));
  const unpaidInvoices = invoices.filter((i) => i.payment_status === 'unpaid');
  const partPaidInvoices = invoices.filter((i) => i.payment_status === 'part_paid');

  const totalCollectedToday = todayPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalExpensesToday = todayExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const totalOutstanding = invoices
    .filter((i) => i.payment_status !== 'paid')
    .reduce((s, i) => s + parseFloat(i.balance || 0), 0);

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Cashier Dashboard</h1>
        <span style={{ color: '#666', fontSize: '13px' }}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </span>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{
          flex: 1, minWidth: '180px', background: '#d4edda',
          borderRadius: '10px', padding: '20px',
          borderLeft: '4px solid #1E7E34',
        }}>
          <p style={{ color: '#155724', fontSize: '13px', marginBottom: '6px' }}>
            Today's Collections
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#155724' }}>
            NGN {totalCollectedToday.toLocaleString()}
          </h2>
          <p style={{ color: '#155724', fontSize: '12px', marginTop: '4px' }}>
            {todayPayments.length} payment(s)
          </p>
        </div>
        <div style={{
          flex: 1, minWidth: '180px', background: '#f8d7da',
          borderRadius: '10px', padding: '20px',
          borderLeft: '4px solid #C0392B',
        }}>
          <p style={{ color: '#721c24', fontSize: '13px', marginBottom: '6px' }}>
            Today's Expenses
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#721c24' }}>
            NGN {totalExpensesToday.toLocaleString()}
          </h2>
          <p style={{ color: '#721c24', fontSize: '12px', marginTop: '4px' }}>
            {todayExpenses.length} expense(s)
          </p>
        </div>
        <div style={{
          flex: 1, minWidth: '180px', background: '#fff3cd',
          borderRadius: '10px', padding: '20px',
          borderLeft: '4px solid #E67E22',
        }}>
          <p style={{ color: '#856404', fontSize: '13px', marginBottom: '6px' }}>
            Outstanding Invoices
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#856404' }}>
            {unpaidInvoices.length + partPaidInvoices.length}
          </h2>
          <p style={{ color: '#856404', fontSize: '12px', marginTop: '4px' }}>
            NGN {totalOutstanding.toLocaleString()} total owed
          </p>
        </div>
        <div style={{
          flex: 1, minWidth: '180px', background: '#d6e4f0',
          borderRadius: '10px', padding: '20px',
          borderLeft: '4px solid #2E75B6',
        }}>
          <p style={{ color: '#1F3864', fontSize: '13px', marginBottom: '6px' }}>
            Net Position Today
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1F3864' }}>
            NGN {(totalCollectedToday - totalExpensesToday).toLocaleString()}
          </h2>
          <p style={{ color: '#1F3864', fontSize: '12px', marginTop: '4px' }}>
            Collections minus expenses
          </p>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h3 style={{ color: '#1F3864', fontSize: '15px', marginBottom: '16px' }}>
          Recent Payments
        </h3>
        {payments.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            No payments recorded yet.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600', color: '#2E75B6' }}>{p.receipt_number}</td>
                  <td>{p.client_name}</td>
                  <td style={{ fontWeight: '600', color: '#1E7E34' }}>
                    NGN {parseFloat(p.amount).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {p.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(p.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── PAYMENTS PAGE ────────────────────────────────────────────
const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    bank_name: '',
    notes: '',
  });

  const fetchInvoices = async () => {
    try {
      const res = await API.get('/cashier/invoices');
      setInvoices(res.data.invoices || []);
    } catch (err) {
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/cashier/payments', {
        invoice_id: selectedInvoice.id,
        client_id: selectedInvoice.client_id,
        ...form,
        amount: parseFloat(form.amount),
      });
      toast.success('Payment recorded successfully. Receipt generated.');
      setSelectedInvoice(null);
      setForm({ amount: '', payment_method: 'cash', reference_number: '', bank_name: '', notes: '' });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'paid') return { cls: 'badge-success', label: 'Paid' };
    if (status === 'part_paid') return { cls: 'badge-warning', label: 'Part Paid' };
    return { cls: 'badge-danger', label: 'Unpaid' };
  };

  if (loading) return <div className="loading">Loading invoices...</div>;

  return (
    <div>
      <h1 className="page-title">Payment Collection</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Client</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const badge = getPaymentBadge(inv.payment_status);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '600', color: '#2E75B6' }}>{inv.invoice_number}</td>
                    <td>{inv.client_name}</td>
                    <td>NGN {parseFloat(inv.total_amount).toLocaleString()}</td>
                    <td style={{ color: '#1E7E34', fontWeight: '600' }}>
                      NGN {parseFloat(inv.amount_paid || 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#C0392B', fontWeight: '600' }}>
                      NGN {parseFloat(inv.balance || 0).toLocaleString()}
                    </td>
                    <td><span className={'badge ' + badge.cls}>{badge.label}</span></td>
                    <td>
                      {inv.payment_status !== 'paid' && (
                        <button
                          className="btn-success"
                          style={{ fontSize: '11px', padding: '5px 10px' }}
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Record Payment</h2>
            <div style={{
              background: '#f0f4fa', borderRadius: '8px',
              padding: '12px', marginBottom: '16px',
            }}>
              <p style={{ fontWeight: '600' }}>{selectedInvoice.client_name}</p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Invoice: {selectedInvoice.invoice_number}
              </p>
              <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: '600' }}>
                Balance Due: NGN {parseFloat(selectedInvoice.balance || 0).toLocaleString()}
              </p>
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Amount Paid (NGN) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  max={selectedInvoice.balance}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="pos">POS</option>
                </select>
              </div>
              {form.payment_method !== 'cash' && (
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    value={form.reference_number}
                    onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    placeholder="Transaction reference or cheque number"
                  />
                </div>
              )}
              {form.payment_method === 'bank_transfer' && (
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. GTBank, Access Bank"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setSelectedInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── EXPENSES PAGE ────────────────────────────────────────────
const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: 'office',
    amount: '',
    description: '',
    payment_method: 'cash',
    authorised_by: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = async () => {
    try {
      const res = await API.get('/cashier/expenses');
      setExpenses(res.data.expenses || []);
    } catch (err) {
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post('/cashier/expenses', { ...form, amount: parseFloat(form.amount) });
      toast.success('Expense recorded successfully.');
      setShowAdd(false);
      setForm({
        category: 'office', amount: '', description: '',
        payment_method: 'cash', authorised_by: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record expense.');
    }
  };

  const categoryLabel = {
    logistics: 'Logistics', loading: 'Loading', office: 'Office',
    maintenance: 'Maintenance', staff_welfare: 'Staff Welfare',
    bank_charges: 'Bank Charges', miscellaneous: 'Miscellaneous',
  };

  if (loading) return <div className="loading">Loading expenses...</div>;

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Expenses</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Record Expense
        </button>
      </div>

      <div className="card mb-2" style={{ padding: '14px 20px' }}>
        <div className="flex gap-3">
          <div>
            <span style={{ color: '#666', fontSize: '12px' }}>Total Expenses</span>
            <p style={{ fontWeight: '700', color: '#C0392B', fontSize: '18px' }}>
              NGN {total.toLocaleString()}
            </p>
          </div>
          <div>
            <span style={{ color: '#666', fontSize: '12px' }}>Records</span>
            <p style={{ fontWeight: '700', color: '#1F3864', fontSize: '18px' }}>
              {expenses.length}
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Authorised By</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontSize: '12px' }}>
                    {new Date(exp.expense_date).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {categoryLabel[exp.category] || exp.category}
                    </span>
                  </td>
                  <td>{exp.description}</td>
                  <td style={{ fontWeight: '600', color: '#C0392B' }}>
                    NGN {parseFloat(exp.amount).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {exp.payment_method.replace('_', ' ').toUpperCase()}
                  </td>
                  <td style={{ fontSize: '12px' }}>{exp.authorised_by || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Record Expense</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="logistics">Logistics / Transport</option>
                  <option value="loading">Loading / Offloading</option>
                  <option value="office">Office Expenses</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="staff_welfare">Staff Welfare</option>
                  <option value="bank_charges">Bank Charges</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (NGN) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the expense"
                  rows="2"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="pos">POS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Authorised By</label>
                <input
                  value={form.authorised_by}
                  onChange={(e) => setForm({ ...form, authorised_by: e.target.value })}
                  placeholder="Name of person who approved this expense"
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PETTY CASH PAGE ──────────────────────────────────────────
const PettyCash = () => {
  const [records, setRecords] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [txType, setTxType] = useState('topup');
  const [form, setForm] = useState({ amount: '', note: '' });

  const fetchRecords = async () => {
    try {
      const res = await API.get('/cashier/petty-cash');
      setRecords(res.data.records || []);
      setBalance(res.data.balance || 0);
    } catch (err) {
      toast.error('Failed to load petty cash records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post('/cashier/petty-cash', {
        transaction_type: txType,
        amount: parseFloat(form.amount),
        note: form.note,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Petty cash updated.');
      setShowAdd(false);
      setForm({ amount: '', note: '' });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update petty cash.');
    }
  };

  if (loading) return <div className="loading">Loading petty cash...</div>;

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Petty Cash</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Transaction
        </button>
      </div>

      <div className="card mb-2" style={{
        padding: '20px',
        background: balance > 0 ? '#d4edda' : '#f8d7da',
        border: '1px solid ' + (balance > 0 ? '#c3e6cb' : '#f5c6cb'),
      }}>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>Current Petty Cash Balance</p>
        <h2 style={{
          fontSize: '32px', fontWeight: '700',
          color: balance > 0 ? '#155724' : '#721c24',
        }}>
          NGN {parseFloat(balance).toLocaleString()}
        </h2>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  No petty cash records yet.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: '12px' }}>
                    {new Date(r.transaction_date).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <span className={
                      'badge ' +
                      (r.transaction_type === 'topup' ? 'badge-success' :
                        r.transaction_type === 'disbursement' ? 'badge-danger' :
                          'badge-info')
                    }>
                      {r.transaction_type.charAt(0).toUpperCase() + r.transaction_type.slice(1)}
                    </span>
                  </td>
                  <td style={{
                    fontWeight: '600',
                    color: r.transaction_type === 'disbursement' ? '#C0392B' : '#1E7E34',
                  }}>
                    NGN {parseFloat(r.amount).toLocaleString()}
                  </td>
                  <td>NGN {parseFloat(r.balance_after).toLocaleString()}</td>
                  <td style={{ fontSize: '12px', color: '#666' }}>{r.note || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Petty Cash Transaction</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Transaction Type *</label>
                <select value={txType} onChange={(e) => setTxType(e.target.value)}>
                  <option value="topup">Top Up (Add Cash)</option>
                  <option value="disbursement">Disbursement (Pay Out)</option>
                  <option value="opening">Opening Balance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (NGN) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Reason or description"
                />
              </div>
              <div className="flex gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OUTSTANDING DEBTS PAGE ───────────────────────────────────
const OutstandingDebts = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/cashier/invoices');
        const unpaid = (res.data.invoices || []).filter((i) => i.payment_status !== 'paid');
        setInvoices(unpaid);
      } catch (err) {
        toast.error('Failed to load debt records.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAgingLabel = (createdAt) => {
    const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    if (days <= 30) return { label: '0-30 days', cls: 'badge-success' };
    if (days <= 60) return { label: '31-60 days', cls: 'badge-warning' };
    if (days <= 90) return { label: '61-90 days', cls: 'badge-danger' };
    return { label: '90+ days', cls: 'badge-danger' };
  };

  if (loading) return <div className="loading">Loading debt records...</div>;

  const totalDebt = invoices.reduce((s, i) => s + parseFloat(i.balance || 0), 0);

  return (
    <div>
      <h1 className="page-title">Outstanding Debts</h1>

      <div className="card mb-2" style={{ padding: '14px 20px', background: '#f8d7da', border: '1px solid #f5c6cb' }}>
        <p style={{ color: '#721c24', fontSize: '13px' }}>Total Outstanding</p>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#721c24' }}>
          NGN {totalDebt.toLocaleString()}
        </h2>
        <p style={{ color: '#721c24', fontSize: '12px' }}>
          Across {invoices.length} unpaid or part-paid invoice(s)
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Client</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Age</th>
              <th>Invoice Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#1E7E34' }}>
                  No outstanding debts. All invoices are paid.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const aging = getAgingLabel(inv.created_at);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '600', color: '#2E75B6' }}>{inv.invoice_number}</td>
                    <td style={{ fontWeight: '600' }}>{inv.client_name}</td>
                    <td>NGN {parseFloat(inv.total_amount).toLocaleString()}</td>
                    <td style={{ color: '#1E7E34' }}>
                      NGN {parseFloat(inv.amount_paid || 0).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '700', color: '#C0392B' }}>
                      NGN {parseFloat(inv.balance || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={'badge ' + (inv.payment_status === 'part_paid' ? 'badge-warning' : 'badge-danger')}>
                        {inv.payment_status === 'part_paid' ? 'Part Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <span className={'badge ' + aging.cls}>{aging.label}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── MAIN CASHIER DASHBOARD ───────────────────────────────────
const CashierDashboard = () => {
  return (
    <Layout menuItems={menuItems}>
      <Routes>
        <Route path="/" element={<CashierHome />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/petty-cash" element={<PettyCash />} />
        <Route path="/debts" element={<OutstandingDebts />} />
      </Routes>
    </Layout>
  );
};

export default CashierDashboard;