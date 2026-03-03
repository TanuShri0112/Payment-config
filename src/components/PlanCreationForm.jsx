import { useState, useEffect } from 'react';
import './PlanCreationForm.css';

const PlanCreationForm = () => {
  const [view, setView] = useState('list'); // 'list' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [numPlans, setNumPlans] = useState(3);
  const [plans, setPlans] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');

  const products = [
    { id: 'course', name: 'AI Powered Course Creation', desc: 'Design complete, interaction-rich learning experiences in 15 minutes.' },
    { id: 'designova', name: 'Designova AI', desc: '' },
    { id: 'athenora', name: 'Athenora Live', desc: '' },
    { id: 'ebook', name: 'E-Book Athena', desc: '' },
    { id: 'operon', name: 'Operon AI: ChatBot Agent', desc: '' },
    { id: 'lms', name: 'Athena LMS', desc: '' },
    { id: 'buildora', name: 'Buildora', desc: '' }
  ];

  const intervalOptions = ['MONTH', 'YEAR', 'DAY', 'WEEK'];
  const planNameTemplates = ['Basic', 'Standard', 'Premium', 'Pro', 'Enterprise'];

  // Initialize plans when numPlans changes
  useEffect(() => {
    if (view === 'edit') {
      const defaultPlans = Array.from({ length: numPlans }, (_, i) => ({
        uiName: planNameTemplates[i] || `Plan ${i + 1}`,
        name: '',
        code: (planNameTemplates[i] || `PLAN_${i + 1}`).toUpperCase(),
        description: '',
        price: '',
        currency: 'USD',
        billingType: 'ONE_TIME',
        interval: 'MONTH',
        intervalCount: 1,
        isActive: true
      }));
      setPlans(defaultPlans);
    }
  }, [numPlans, view]);

  const handlePlanChange = (index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index][field] = value;
    setPlans(updatedPlans);

    if (errors[`${field}-${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${field}-${index}`];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedProduct) newErrors.product = 'Required';

    plans.forEach((plan, index) => {
      if (!plan.name.trim()) newErrors[`name-${index}`] = 'Required';
      if (!plan.code.trim()) newErrors[`code-${index}`] = 'Required';
      if (!plan.price || isNaN(plan.price)) newErrors[`price-${index}`] = 'Invalid';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newConfig = {
      productId: selectedProduct,
      productName: products.find(p => p.id === selectedProduct)?.name,
      plans: plans.map(p => ({ ...p, price: parseInt(p.price) })),
      timestamp: new Date().toLocaleString()
    };

    // Replace if exists, else add
    const existingIndex = savedConfigs.findIndex(c => c.productId === selectedProduct);
    if (existingIndex >= 0) {
      const updated = [...savedConfigs];
      updated[existingIndex] = newConfig;
      setSavedConfigs(updated);
    } else {
      setSavedConfigs([...savedConfigs, newConfig]);
    }

    setSubmitMessage('Configuration saved');
    setTimeout(() => {
      setSubmitMessage('');
      setView('list');
    }, 1500);
  };

  const startEdit = (config) => {
    setSelectedProduct(config.productId);
    setNumPlans(config.plans.length);
    setPlans(config.plans);
    setView('edit');
  };

  const addNew = () => {
    setSelectedProduct('');
    setNumPlans(3);
    setView('edit');
  };

  return (
    <div className="plan-manager">
      <div className="view-switcher">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>All Products</button>
        <button className={view === 'edit' ? 'active' : ''} onClick={addNew}>+ New Config</button>
      </div>

      {view === 'list' ? (
        <div className="list-view">
          <h2>Product Plan Overview</h2>
          {savedConfigs.length === 0 ? (
            <div className="empty-state">
              <p>No product plans configured yet.</p>
              <button onClick={addNew} className="primary-btn">Create First Config</button>
            </div>
          ) : (
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Plans</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedConfigs.map(config => (
                  <tr key={config.productId}>
                    <td><strong>{config.productName}</strong></td>
                    <td>{config.plans.map(p => p.name).join(', ')}</td>
                    <td>{config.timestamp}</td>
                    <td>
                      <button onClick={() => startEdit(config)} className="edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="edit-view">
          <div className="top-bar">
            <div className="input-group">
              <label>Link Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={errors.product ? 'error' : ''}
              >
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Plan Count</label>
              <select value={numPlans} onChange={(e) => setNumPlans(parseInt(e.target.value))}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="plans-layout">
              {plans.map((plan, index) => (
                <div key={index} className="plan-column">
                  <div className="plan-header">
                    <span className="badge">{plan.uiName}</span>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={plan.isActive}
                        onChange={(e) => handlePlanChange(index, 'isActive', e.target.checked)}
                      />
                      Active
                    </label>
                  </div>

                  <div className="plan-body">
                    <div className="row">
                      <div className="field">
                        <label>Plan Name*</label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) => handlePlanChange(index, 'name', e.target.value)}
                          placeholder="e.g. Basic"
                          className={errors[`name-${index}`] ? 'error' : ''}
                        />
                      </div>
                      <div className="field">
                        <label>Code*</label>
                        <input
                          type="text"
                          value={plan.code}
                          onChange={(e) => handlePlanChange(index, 'code', e.target.value.toUpperCase())}
                          className={errors[`code-${index}`] ? 'error' : ''}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Description</label>
                      <textarea
                        value={plan.description}
                        onChange={(e) => handlePlanChange(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="billing-box">
                      <div className="tabs">
                        <button
                          type="button"
                          className={plan.billingType === 'ONE_TIME' ? 'active' : ''}
                          onClick={() => handlePlanChange(index, 'billingType', 'ONE_TIME')}
                        >One-Time</button>
                        <button
                          type="button"
                          className={plan.billingType === 'RECURRING' ? 'active' : ''}
                          onClick={() => handlePlanChange(index, 'billingType', 'RECURRING')}
                        >Subscription</button>
                      </div>

                      {plan.billingType === 'RECURRING' && (
                        <div className="interval-fields">
                          <select value={plan.interval} onChange={(e) => handlePlanChange(index, 'interval', e.target.value)}>
                            {intervalOptions.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <input
                            type="number"
                            value={plan.intervalCount}
                            onChange={(e) => handlePlanChange(index, 'intervalCount', parseInt(e.target.value))}
                          />
                        </div>
                      )}
                    </div>

                    <div className="price-row">
                      <label>Price (USD)</label>
                      <div className="price-input">
                        <span className="unit">$</span>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => handlePlanChange(index, 'price', e.target.value)}
                          className={errors[`price-${index}`] ? 'error' : ''}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-footer">
              <button type="submit" className="save-button">Save Configuration</button>
              {submitMessage && <p className="success">{submitMessage}</p>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlanCreationForm;
