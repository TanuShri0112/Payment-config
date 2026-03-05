import { useState, useEffect } from 'react';
import './PlanCreationForm.css';

const PlanCreationForm = () => {
  const [view, setView] = useState('list'); // 'list' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [numPlans, setNumPlans] = useState(1);
  const [plans, setPlans] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [previewProductId, setPreviewProductId] = useState(null);

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
  const DESC_LIMIT = 200;

  // Initialize or adjust plans when numPlans changes
  useEffect(() => {
    if (view === 'edit') {
      setPlans(prevPlans => {
        // If we're coming from list view with empty plans, or if count changed in editor
        if (numPlans > prevPlans.length) {
          // Add new plans, preserving old ones
          const newPlans = Array.from({ length: numPlans - prevPlans.length }, (_, i) => {
            const index = prevPlans.length + i;
            return {
              name: '',
              description: '',
              price: '',
              currency: 'USD',
              billingType: 'ONE_TIME',
              interval: 'MONTH',
              intervalCount: 1,
              isActive: true,
              isModified: true
            };
          });
          return [...prevPlans, ...newPlans];
        } else if (numPlans < prevPlans.length) {
          // Truncate list
          return prevPlans.slice(0, numPlans);
        }
        return prevPlans;
      });
    }
  }, [numPlans, view]);

  const handlePlanChange = (index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index][field] = value;

    // Track if the plan has been modified since the last save
    const internalFields = ['isSaving', 'lastSaved', 'isModified'];
    if (!internalFields.includes(field)) {
      updatedPlans[index].isModified = true;
    }

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
      if (!plan.price || isNaN(plan.price) || Number(plan.price) <= 0) newErrors[`price-${index}`] = 'Invalid';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePlan = (index) => {
    const newErrors = {};
    if (!selectedProduct) newErrors.product = 'Required';

    const plan = plans[index];
    if (!plan.name.trim()) newErrors[`name-${index}`] = 'Required';
    if (!plan.price || isNaN(plan.price) || Number(plan.price) <= 0) newErrors[`price-${index}`] = 'Invalid';

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).every(key => !key.endsWith(`-${index}`) && key !== 'product') ||
      (Object.keys(newErrors).length === 0);
  };

  const handleSavePlan = async (index) => {
    // Basic validation for this specific plan
    const planErrors = {};
    if (!selectedProduct) planErrors.product = 'Required';
    if (!plans[index].name.trim()) planErrors[`name-${index}`] = 'Required';
    if (!plans[index].price || isNaN(plans[index].price) || Number(plans[index].price) <= 0) planErrors[`price-${index}`] = 'Invalid';

    if (Object.keys(planErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...planErrors }));
      return;
    }

    // Prepare payload
    const planPayload = {
      productId: selectedProduct,
      ...plans[index],
      price: parseInt(plans[index].price)
    };

    console.log('Saving individual plan:', planPayload);

    // Simulate API call
    handlePlanChange(index, 'isSaving', true);

    await new Promise(resolve => setTimeout(resolve, 800));

    handlePlanChange(index, 'isSaving', false);
    handlePlanChange(index, 'lastSaved', new Date().toLocaleTimeString());
    handlePlanChange(index, 'isModified', false); // Reset modified flag after saving

    // Update local storage/state for consistency
    const updatedConfigs = [...savedConfigs];
    const existingIndex = updatedConfigs.findIndex(c => c.productId === selectedProduct);

    if (existingIndex >= 0) {
      const existingPlans = [...updatedConfigs[existingIndex].plans];
      existingPlans[index] = planPayload;
      updatedConfigs[existingIndex] = { ...updatedConfigs[existingIndex], plans: existingPlans, timestamp: new Date().toLocaleString() };
    } else {
      updatedConfigs.push({
        productId: selectedProduct,
        productName: products.find(p => p.id === selectedProduct)?.name,
        plans: [planPayload],
        timestamp: new Date().toLocaleString()
      });
    }
    setSavedConfigs(updatedConfigs);

    // Auto-switch to next plan if available
    if (index < plans.length - 1) {
      setTimeout(() => {
        setActivePlanIndex(index + 1);
      }, 800);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Check if all plans are saved
    const allPlansSaved = plans.every(p => p.lastSaved && !p.isModified);
    if (!allPlansSaved) {
      setErrors(prev => ({ ...prev, global: 'Please save each plan individually before finishing.' }));
      return;
    }

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

  const startEdit = (config, initialPlanIndex = 0) => {
    setSelectedProduct(config.productId);
    setNumPlans(config.plans.length);
    const plansWithFlags = config.plans.map(p => ({
      ...p,
      isModified: false,
      isSaving: false,
      lastSaved: new Date().toLocaleTimeString()
    }));
    setPlans(plansWithFlags);
    setActivePlanIndex(initialPlanIndex);
    setView('edit');
  };

  const addNew = (productId = '') => {
    setSelectedProduct(productId);
    setPlans([]); // Clear plans to allow fresh initialization
    setErrors({});
    setNumPlans(1);
    setActivePlanIndex(0);
    setView('edit');
  };

  // Sync preview ID if not set
  useEffect(() => {
    if (products.length > 0 && !previewProductId) {
      setPreviewProductId(products[0].id);
    }
  }, [previewProductId]);

  const activeConfig = savedConfigs.find(c => c.productId === previewProductId);
  const activeProduct = products.find(p => p.id === previewProductId);

  // Scroll to top on navigation/switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, activePlanIndex]);

  return (
    <div className="plan-manager">
      <div className="view-switcher">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>All Products</button>
        <button className={view === 'edit' ? 'active' : ''} onClick={addNew}>+ New Plans</button>
      </div>

      {view === 'list' ? (
        <div className="list-view">
          <div className="list-header">
            <h2>Product Catalog</h2>
            <div className="product-navigator">
              {products.map(product => {
                const isConfigured = savedConfigs.some(c => c.productId === product.id);
                return (
                  <button
                    key={product.id}
                    className={`nav-pill ${previewProductId === product.id ? 'active' : ''} ${isConfigured ? 'configured' : 'unconfigured'}`}
                    onClick={() => setPreviewProductId(product.id)}
                  >
                    {product.name}
                    {isConfigured && <span className="tab-dot"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="preview-container">
            {!activeConfig ? (
              <div className="empty-product-state">
                <div className="empty-content">
                  <h3>No Configuration for {activeProduct?.name}</h3>
                  <p>Build your first {activeProduct?.name} pricing plan.</p>
                  <button onClick={() => addNew(previewProductId)} className="setup-btn">
                    + Create Configuration
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="preview-header">
                  <div className="preview-meta">
                    <h3>{activeConfig.productName} Plans</h3>
                    <p>Last updated: {activeConfig.timestamp}</p>
                  </div>
                  <button onClick={() => startEdit(activeConfig)} className="edit-config-btn">
                    Edit All Plans
                  </button>
                </div>

                <div className="pricing-grid">
                  {activeConfig.plans.map((plan, idx) => (
                    <div key={idx} className={`pricing-card card-variant-${idx % 3}`}>
                      <div className="card-top">
                        <span className="card-tag">Plan {idx + 1}</span>
                        <h4>{plan.name}</h4>
                      </div>

                      <div className="card-price">
                        <span className="currency">$</span>
                        <span className="amount">{plan.price}</span>
                        <span className="period">/{plan.interval?.toLowerCase()}</span>
                      </div>

                      <div className="card-desc">
                        <p>{plan.description || "No description provided."}</p>
                      </div>

                      <div className="card-features">
                        <ul>
                          <li><span className="check">✓</span> {plan.billingType === 'RECURRING' ? 'Recurring Access' : 'One-time Payment'}</li>
                          <li><span className="check">✓</span> Status: {plan.isActive ? 'Active' : 'Inactive'}</li>
                        </ul>
                      </div>

                      <div className="card-action">
                        <button
                          className="preview-btn"
                          onClick={() => startEdit(activeConfig, idx)}
                        >
                          Edit Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="edit-container">
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
              <label>Total Plan Count</label>
              <select value={numPlans} onChange={(e) => {
                setNumPlans(parseInt(e.target.value));
                setActivePlanIndex(0);
              }}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="plan-editor-wrapper">
            <div className="plan-tabs">
              {plans.map((plan, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`plan-tab ${activePlanIndex === idx ? 'active' : ''} ${plan.lastSaved && !plan.isModified ? 'saved' : ''}`}
                  onClick={() => setActivePlanIndex(idx)}
                >
                  <span className="tab-label">{plan.name || `Plan ${idx + 1}`}</span>
                  {plan.lastSaved && !plan.isModified && <span className="tab-status">✓</span>}
                </button>
              ))}
            </div>

            <div className="active-plan-form">
              {plans[activePlanIndex] && (
                <div className="plan-card">
                  <div className="card-header">
                    <div className="header-info">
                      <h3>{plans[activePlanIndex].name || `Plan ${activePlanIndex + 1}`} Configuration</h3>
                      <p>Fine-tune individual features and pricing for this tier.</p>
                    </div>
                    <label className="toggle-active">
                      <input
                        type="checkbox"
                        checked={plans[activePlanIndex].isActive}
                        onChange={(e) => handlePlanChange(activePlanIndex, 'isActive', e.target.checked)}
                      />
                      <span className="toggle-label">Active</span>
                    </label>
                  </div>

                  <div className="card-body">
                    <div className="field">
                      <label>Display Name*</label>
                      <input
                        type="text"
                        value={plans[activePlanIndex].name}
                        onChange={(e) => handlePlanChange(activePlanIndex, 'name', e.target.value)}
                        placeholder="e.g. Professional Tier"
                        className={errors[`name-${activePlanIndex}`] ? 'error' : ''}
                      />
                    </div>

                    <div className="field">
                      <div className="label-row">
                        <label>Plan Description</label>
                        <span className={`char-count ${plans[activePlanIndex].description.length >= DESC_LIMIT ? 'limit' : ''}`}>
                          {plans[activePlanIndex].description.length}/{DESC_LIMIT}
                        </span>
                      </div>
                      <textarea
                        value={plans[activePlanIndex].description}
                        onChange={(e) => handlePlanChange(activePlanIndex, 'description', e.target.value)}
                        rows={3}
                        maxLength={DESC_LIMIT}
                        placeholder="Tell users what's included in this plan..."
                      />
                    </div>

                    <div className="billing-section">
                      <label className="section-label">Billing Strategy</label>
                      <div className="strategy-toggle">
                        <button
                          type="button"
                          className={plans[activePlanIndex].billingType === 'ONE_TIME' ? 'active' : ''}
                          onClick={() => handlePlanChange(activePlanIndex, 'billingType', 'ONE_TIME')}
                        >One-Time Payment</button>
                        <button
                          type="button"
                          className={plans[activePlanIndex].billingType === 'RECURRING' ? 'active' : ''}
                          onClick={() => handlePlanChange(activePlanIndex, 'billingType', 'RECURRING')}
                        >Recurring Subscription</button>
                      </div>

                      {plans[activePlanIndex].billingType === 'RECURRING' && (
                        <div className="interval-row">
                          <div className="field">
                            <label>Interval</label>
                            <select value={plans[activePlanIndex].interval} onChange={(e) => handlePlanChange(activePlanIndex, 'interval', e.target.value)}>
                              {intervalOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Count</label>
                            <input
                              type="number"
                              value={plans[activePlanIndex].intervalCount}
                              onChange={(e) => handlePlanChange(activePlanIndex, 'intervalCount', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="price-section">
                      <label className="section-label">Pricing</label>
                      <div className="price-box">
                        <span className="currency-symbol">$</span>
                        <input
                          type="number"
                          min="1"
                          value={plans[activePlanIndex].price}
                          onChange={(e) => handlePlanChange(activePlanIndex, 'price', e.target.value)}
                          className={errors[`price-${activePlanIndex}`] ? 'error' : ''}
                          placeholder="0"
                        />
                        <span className="currency-code">USD</span>
                      </div>
                    </div>

                    <div className="plan-save-footer">
                      <button
                        type="button"
                        className={`plan-save-btn ${(plans[activePlanIndex].lastSaved && !plans[activePlanIndex].isModified) ? 'completed' : ''}`}
                        onClick={() => handleSavePlan(activePlanIndex)}
                        disabled={plans[activePlanIndex].isSaving}
                      >
                        {plans[activePlanIndex].isSaving ? 'Saving Changes...' : (plans[activePlanIndex].lastSaved && !plans[activePlanIndex].isModified) ? '✓ Plan Synced' : 'Save Plan Details'}
                      </button>
                      {plans[activePlanIndex].lastSaved && (
                        <span className="sync-time">Last Synced: {plans[activePlanIndex].lastSaved}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <form onSubmit={handleSave}>
              <div className="footer-content">
                {!plans.every(p => p.lastSaved && !p.isModified) && (
                  <p className="save-hint">⚠️ All plans must be saved individually before finalizing.</p>
                )}
                <button
                  type="submit"
                  className={`save-button ${!plans.every(p => p.lastSaved && !p.isModified) ? 'disabled' : ''}`}
                >
                  Complete Configuration
                </button>
                {errors.global && <p className="error-text">{errors.global}</p>}
                {submitMessage && <p className="success">{submitMessage}</p>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCreationForm;
