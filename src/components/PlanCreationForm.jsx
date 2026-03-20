import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiDollarSign, FiCheck, FiX, FiClipboard, FiSearch, FiInbox } from 'react-icons/fi';
import './PlanCreationForm.css';
import productPlanService from '../services/productPlanService';

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
  const [filterType, setFilterType] = useState('all'); // Filter state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // Dropdown state
  const [deleteModal, setDeleteModal] = useState({ show: false, planId: null, productId: null, planIndex: null }); // Delete modal state
  const [copySuccess, setCopySuccess] = useState(null); // Copy feedback state
  const [searchTerm, setSearchTerm] = useState(''); // Search state

  // Utility functions for currency conversion
  const dollarsToCents = (dollars) => {
    return Math.round(parseFloat(dollars) * 100);
  };

  const centsToDollars = (cents) => {
    return (cents / 100).toFixed(2);
  };

  const products = [
    { id: '325b5f10-640f-49f4-8ebf-a6aca823233c', name: 'E-Book Athena', desc: 'Create and sell digital e-books with AI assistance' },
    { id: '5a75ebfd-ad81-49e4-8115-7040aff78030', name: 'Designova', desc: 'AI-powered design tool for creating stunning visuals' },
    // Add other products here as you get their UUIDs from backend
    // { id: 'another-uuid-here', name: 'AI Powered Course Creation', desc: 'Design complete, interaction-rich learning experiences in 15 minutes.' },
    // { id: 'another-uuid-here', name: 'Athenora Live', desc: '' },
    // { id: 'another-uuid-here', name: 'Operon AI: ChatBot Agent', desc: '' },
    // { id: 'another-uuid-here', name: 'Athena LMS', desc: '' },
    // { id: 'another-uuid-here', name: 'Buildora', desc: '' }
  ];

  const intervalOptions = ['MONTH', 'YEAR', 'DAY', 'WEEK'];
  const currencyOptions = [
    { code: 'usd', symbol: '$', name: 'USD - US Dollar' },
    { code: 'cad', symbol: 'C$', name: 'CAD - Canadian Dollar' }
  ];
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
              currency: 'usd',
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
      
      // Validate book ID for E-Book product with one-time payment
      if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME') {
        if (!plan.bookId || plan.bookId.trim() === '') {
          newErrors[`bookId-${index}`] = 'Book ID is required for E-Book one-time payment';
        }
      }
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
    
    // Validate book ID for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME') {
      if (!plan.bookId || plan.bookId.trim() === '') {
        newErrors[`bookId-${index}`] = 'Book ID is required for E-Book one-time payment';
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).every(key => !key.endsWith(`-${index}`) && key !== 'product') ||
      (Object.keys(newErrors).length === 0);
  };

  const handleSavePlan = async (index) => {
    const plan = plans[index];
    
    // If plan already has an ID, update it instead of creating
    if (plan.planId) {
      return handleUpdatePlan(index);
    }

    // Basic validation for this specific plan
    const planErrors = {};
    if (!selectedProduct) planErrors.product = 'Required';
    if (!plan.name.trim()) planErrors[`name-${index}`] = 'Required';
    if (!plan.price || isNaN(plan.price) || Number(plan.price) <= 0) planErrors[`price-${index}`] = 'Invalid';
    
    // Validate book ID for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME') {
      if (!plan.bookId || plan.bookId.trim() === '') {
        planErrors[`bookId-${index}`] = 'Book ID is required for E-Book one-time payment';
      }
    }

    if (Object.keys(planErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...planErrors }));
      return;
    }

    // Prepare payload for backend API
    const planPayload = {
      productId: selectedProduct,
      name: plan.name,
      description: plan.description,
      price: dollarsToCents(plan.price), // Convert dollars to cents
      currency: plan.currency || 'usd',
      billingType: plan.billingType,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      isActive: plan.isActive,
      metadata: {} // Add any additional metadata if needed
    };

    // Add book ID to metadata for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME' && plan.bookId) {
      planPayload.metadata.bookId = plan.bookId;
    }

    console.log('Saving individual plan to backend:', planPayload);

    // Call backend API
    handlePlanChange(index, 'isSaving', true);

    try {
      const result = await productPlanService.createPlan(planPayload);
      
      handlePlanChange(index, 'isSaving', false);
      handlePlanChange(index, 'lastSaved', new Date().toLocaleTimeString());
      handlePlanChange(index, 'isModified', false);
      handlePlanChange(index, 'planId', result.data?.id || result.planId); // Store the returned plan ID

      // Update local storage/state for consistency
      const updatedConfigs = [...savedConfigs];
      const existingIndex = updatedConfigs.findIndex(c => c.productId === selectedProduct);

      if (existingIndex >= 0) {
        const existingPlans = [...updatedConfigs[existingIndex].plans];
        existingPlans[index] = { ...planPayload, planId: result.data?.id || result.planId };
        updatedConfigs[existingIndex] = { ...updatedConfigs[existingIndex], plans: existingPlans, timestamp: new Date().toLocaleString() };
      } else {
        updatedConfigs.push({
          productId: selectedProduct,
          productName: products.find(p => p.id === selectedProduct)?.name,
          plans: [{ ...planPayload, planId: result.data?.id || result.planId }],
          timestamp: new Date().toLocaleString()
        });
      }
      setSavedConfigs(updatedConfigs);

      // Show success message
      setSubmitMessage(`✅ Plan "${plan.name}" saved successfully!`);
      setTimeout(() => setSubmitMessage(''), 3000);

      // Auto-switch to next plan if available
      if (index < plans.length - 1) {
        setTimeout(() => {
          setActivePlanIndex(index + 1);
        }, 800);
      }

    } catch (error) {
      console.error('Error saving plan:', error);
      handlePlanChange(index, 'isSaving', false);
      setErrors(prev => ({ 
        ...prev, 
        [`save-${index}`]: error.message || 'Failed to save plan. Please try again.' 
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Debug: Log current plan states
    console.log('Plan states for validation:', plans.map(p => ({
      name: p.name,
      planId: p.planId,
      lastSaved: p.lastSaved,
      isModified: p.isModified
    })));

    // Check if all plans are saved - improved logic
    const allPlansSaved = plans.every(p => {
      // Plan is saved if it has a planId (from backend) OR has lastSaved timestamp and not modified
      const isSaved = (p.planId || (p.lastSaved && !p.isModified));
      console.log(`Plan "${p.name}": planId=${p.planId}, lastSaved=${p.lastSaved}, isModified=${p.isModified}, isSaved=${isSaved}`);
      return isSaved;
    });
    
    console.log('All plans saved?', allPlansSaved);
    
    if (!allPlansSaved) {
      setErrors(prev => ({ ...prev, global: 'Please save each plan individually before finishing.' }));
      return;
    }

    // Find existing configuration for this product
    const existingConfig = savedConfigs.find(c => c.productId === selectedProduct);
    
    let mergedPlans;
    if (existingConfig && existingConfig.plans) {
      // Merge existing plans with new plans, avoiding duplicates
      const existingPlanIds = new Set(existingConfig.plans.map(p => p.planId).filter(Boolean));
      const newPlansToAdd = plans.filter(p => p.planId && !existingPlanIds.has(p.planId));
      
      mergedPlans = [...existingConfig.plans, ...newPlansToAdd];
      console.log('Merged plans:', mergedPlans);
    } else {
      // No existing plans, use current plans
      mergedPlans = plans.map(p => ({ ...p, price: parseInt(p.price) }));
    }

    const newConfig = {
      productId: selectedProduct,
      productName: products.find(p => p.id === selectedProduct)?.name,
      plans: mergedPlans,
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

  const startEdit = (config, initialPlanIndex = null) => {
    setSelectedProduct(config.productId);
    
    // Check if editing all plans or just one plan
    if (initialPlanIndex === null) {
      // Edit all plans
      setNumPlans(config.plans.length);
      const plansWithFlags = config.plans.map(p => ({
        ...p,
        // Load bookId from metadata for E-Book plans
        bookId: p.metadata?.bookId || p.bookId || '',
        isModified: false,
        isSaving: false,
        lastSaved: new Date().toLocaleTimeString()
      }));
      setPlans(plansWithFlags);
      setActivePlanIndex(0);
    } else {
      // Edit single plan only
      setNumPlans(1);
      const planToEdit = config.plans[initialPlanIndex];
      const plansWithFlags = [{
        ...planToEdit,
        // Load bookId from metadata for E-Book plans
        bookId: planToEdit.metadata?.bookId || planToEdit.bookId || '',
        isModified: false,
        isSaving: false,
        lastSaved: new Date().toLocaleTimeString()
      }];
      setPlans(plansWithFlags);
      setActivePlanIndex(0);
    }
    
    setView('edit');
  };

  const addNew = (productId = '') => {
    // If already in edit view, don't do anything to prevent UI vanishing
    if (view === 'edit') {
      return;
    }
    
    setSelectedProduct(productId);
    setPlans([]); // Clear plans to allow fresh initialization
    setErrors({});
    setNumPlans(1);
    setActivePlanIndex(0);
    setView('edit');
  };

  // Update existing plan
  const handleUpdatePlan = async (index) => {
    const plan = plans[index];
    if (!plan.planId) {
      // If no planId, treat as create
      return handleSavePlan(index);
    }

    // Basic validation
    const planErrors = {};
    if (!selectedProduct) planErrors.product = 'Required';
    if (!plan.name.trim()) planErrors[`name-${index}`] = 'Required';
    if (!plan.price || isNaN(plan.price) || Number(plan.price) <= 0) planErrors[`price-${index}`] = 'Invalid';
    
    // Validate book ID for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME') {
      if (!plan.bookId || plan.bookId.trim() === '') {
        planErrors[`bookId-${index}`] = 'Book ID is required for E-Book one-time payment';
      }
    }

    if (Object.keys(planErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...planErrors }));
      return;
    }

    // Prepare payload for backend API
    const planPayload = {
      productId: selectedProduct,
      name: plan.name,
      description: plan.description,
      price: dollarsToCents(plan.price), // Convert dollars to cents
      currency: plan.currency || 'usd',
      billingType: plan.billingType,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      isActive: plan.isActive,
      metadata: {}
    };

    // Add book ID to metadata for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME' && plan.bookId) {
      planPayload.metadata.bookId = plan.bookId;
    }

    console.log('Updating plan to backend:', planPayload);

    handlePlanChange(index, 'isSaving', true);

    try {
      const result = await productPlanService.updatePlan(plan.planId, planPayload);
      
      handlePlanChange(index, 'isSaving', false);
      handlePlanChange(index, 'lastSaved', new Date().toLocaleTimeString());
      handlePlanChange(index, 'isModified', false);

      // Update local storage/state
      const updatedConfigs = [...savedConfigs];
      const existingIndex = updatedConfigs.findIndex(c => c.productId === selectedProduct);

      if (existingIndex >= 0) {
        const existingPlans = [...updatedConfigs[existingIndex].plans];
        existingPlans[index] = { ...planPayload, planId: plan.planId };
        updatedConfigs[existingIndex] = { ...updatedConfigs[existingIndex], plans: existingPlans, timestamp: new Date().toLocaleString() };
        setSavedConfigs(updatedConfigs);
      }

      setSubmitMessage(`✅ Plan "${plan.name}" updated successfully!`);
      setTimeout(() => setSubmitMessage(''), 3000);

    } catch (error) {
      console.error('Error updating plan:', error);
      handlePlanChange(index, 'isSaving', false);
      setErrors(prev => ({ 
        ...prev, 
        [`save-${index}`]: error.message || 'Failed to update plan. Please try again.' 
      }));
    }
  };

  // Show delete confirmation modal
  const showDeleteModal = (planId, productId, planIndex) => {
    setDeleteModal({
      show: true,
      planId,
      productId,
      planIndex
    });
  };

  // Hide delete modal
  const hideDeleteModal = () => {
    setDeleteModal({ show: false, planId: null, productId: null, planIndex: null });
  };

  // Confirm delete
  const confirmDelete = async () => {
    const { planId, productId, planIndex } = deleteModal;
    if (!planId) {
      console.warn('Cannot delete plan without ID');
      hideDeleteModal();
      return;
    }

    try {
      await productPlanService.deletePlan(planId);
      
      // Update local state
      const updatedConfigs = [...savedConfigs];
      const configIndex = updatedConfigs.findIndex(c => c.productId === productId);
      
      if (configIndex >= 0) {
        updatedConfigs[configIndex].plans = updatedConfigs[configIndex].plans.filter(p => p.planId !== planId);
        
        // Remove the entire config if no plans left
        if (updatedConfigs[configIndex].plans.length === 0) {
          updatedConfigs.splice(configIndex, 1);
        }
        
        setSavedConfigs(updatedConfigs);
      }
      
      setSubmitMessage('✅ Plan deleted successfully!');
      setTimeout(() => setSubmitMessage(''), 3000);

    } catch (error) {
      console.error('Error deleting plan:', error);
      setSubmitMessage(`❌ Failed to delete plan: ${error.message}`);
      setTimeout(() => setSubmitMessage(''), 3000);
    } finally {
      hideDeleteModal();
    }
  };

  // Delete plan
  const handleDeletePlan = (planId, productId, planIndex) => {
    showDeleteModal(planId, productId, planIndex);
  };

  // Check if current plan is valid for saving
  const isCurrentPlanValid = () => {
    // First check if product is selected
    if (!selectedProduct) return false;
    
    const plan = plans[activePlanIndex];
    if (!plan) return false;
    
    // Check required fields
    if (!plan.name || plan.name.trim() === '') return false;
    if (!plan.price || isNaN(plan.price) || Number(plan.price) <= 0) return false;
    
    // Check book ID for E-Book product with one-time payment
    if (selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plan.billingType === 'ONE_TIME') {
      if (!plan.bookId || plan.bookId.trim() === '') return false;
    }
    
    return true;
  };

  // Load existing plans from backend
  const loadPlansFromBackend = async (productName = '') => {
    try {
      const result = await productPlanService.getAllPlans(productName);
      if (result.success && result.data) {
        // Group plans by productId
        const plansByProduct = result.data.reduce((acc, plan) => {
          const productId = plan.productId;
          if (!acc[productId]) {
            acc[productId] = {
              productId,
              productName: products.find(p => p.id === productId)?.name || productId,
              plans: [],
              timestamp: new Date(plan.createdAt).toLocaleString()
            };
          }
          acc[productId].plans.push({
            ...plan,
            planId: plan.id,
            price: parseFloat(centsToDollars(plan.price)), // Convert cents to dollars
            isModified: false,
            isSaving: false,
            lastSaved: new Date(plan.createdAt).toLocaleTimeString()
          });
          return acc;
        }, {});
        
        setSavedConfigs(Object.values(plansByProduct));
        console.log('Refreshed plans from backend:', Object.values(plansByProduct));
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      // Don't show error to user on initial load, just log it
    }
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Load plans on component mount
  useEffect(() => {
    loadPlansFromBackend();
  }, []);

  // Auto-refresh when switching to list view
  useEffect(() => {
    if (view === 'list') {
      loadPlansFromBackend();
    }
  }, [view]);

  // Sync preview ID if not set
  useEffect(() => {
    if (products.length > 0 && !previewProductId) {
      setPreviewProductId(products[0].id);
    }
  }, [previewProductId]);

  // Get filter display label
  const getFilterLabel = () => {
    switch (filterType) {
      case 'recurring': return 'Recurring';
      case 'onetime': return 'One-Time';
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return 'All Plans';
    }
  };

  // Get filter count
  const getFilterCount = () => {
    if (!activeConfig) return 0;
    switch (filterType) {
      case 'recurring': return activeConfig.plans.filter(p => p.billingType === 'RECURRING').length;
      case 'onetime': return activeConfig.plans.filter(p => p.billingType === 'ONE_TIME').length;
      case 'active': return activeConfig.plans.filter(p => p.isActive === true).length;
      case 'inactive': return activeConfig.plans.filter(p => p.isActive === false).length;
      default: return activeConfig.plans.length;
    }
  };

  // Filter plans based on selected filter type and search term
  const filterPlans = (plans) => {
    let filtered = plans;
    
    // First apply the type filter
    switch (filterType) {
      case 'recurring':
        filtered = plans.filter(plan => plan.billingType === 'RECURRING');
        break;
      case 'onetime':
        filtered = plans.filter(plan => plan.billingType === 'ONE_TIME');
        break;
      case 'active':
        filtered = plans.filter(plan => plan.isActive === true);
        break;
      case 'inactive':
        filtered = plans.filter(plan => plan.isActive === false);
        break;
      default:
        filtered = plans;
    }

    // Then apply search filter if present
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(term) || 
        (plan.description && plan.description.toLowerCase().includes(term)) ||
        (plan.planId && plan.planId.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const activeConfig = savedConfigs.find(c => c.productId === previewProductId);
  const activeProduct = products.find(p => p.id === previewProductId);
  
  // Get filtered plans for display
  const filteredPlans = activeConfig ? filterPlans(activeConfig.plans) : [];

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
                  <div className="header-actions">
                    <div className="search-box">
                      <FiSearch className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search plans..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                          <FiX />
                        </button>
                      )}
                    </div>
                    <div className="filter-dropdown">
                      <button 
                        className={`filter-dropdown-btn ${showFilterDropdown ? 'active' : ''}`}
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      >
                        <span className="filter-label-text">{getFilterLabel()}</span>
                        <span className="filter-count" style={{marginLeft: 'auto', marginRight: '0.5rem'}}>{getFilterCount()}</span>
                        <span className={`dropdown-arrow ${showFilterDropdown ? 'open' : ''}`}>▼</span>
                      </button>

                      {showFilterDropdown && (
                        <div className="dropdown-menu">
                          <button
                            className={`dropdown-item ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => { setFilterType('all'); setShowFilterDropdown(false); }}
                          >
                            <span>All Plans</span>
                            <span className="filter-count">{activeConfig.plans.length}</span>
                          </button>
                          <button
                            className={`dropdown-item ${filterType === 'recurring' ? 'active' : ''}`}
                            onClick={() => { setFilterType('recurring'); setShowFilterDropdown(false); }}
                          >
                            <span>Recurring</span>
                            <span className="filter-count">{activeConfig.plans.filter(p => p.billingType === 'RECURRING').length}</span>
                          </button>
                          <button
                            className={`dropdown-item ${filterType === 'onetime' ? 'active' : ''}`}
                            onClick={() => { setFilterType('onetime'); setShowFilterDropdown(false); }}
                          >
                            <span>One-Time</span>
                            <span className="filter-count">{activeConfig.plans.filter(p => p.billingType === 'ONE_TIME').length}</span>
                          </button>
                          <button
                            className={`dropdown-item ${filterType === 'active' ? 'active' : ''}`}
                            onClick={() => { setFilterType('active'); setShowFilterDropdown(false); }}
                          >
                            <span>Active</span>
                            <span className="filter-count">{activeConfig.plans.filter(p => p.isActive === true).length}</span>
                          </button>
                          <button
                            className={`dropdown-item ${filterType === 'inactive' ? 'active' : ''}`}
                            onClick={() => { setFilterType('inactive'); setShowFilterDropdown(false); }}
                          >
                            <span>Inactive</span>
                            <span className="filter-count">{activeConfig.plans.filter(p => p.isActive === false).length}</span>
                          </button>
                        </div>

                      )}
                    </div>
                    <button onClick={() => startEdit(activeConfig)} className="edit-config-btn">
                      Edit All Plans
                    </button>
                  </div>
                </div>

                <div className="plans-list">
                  {filteredPlans.length === 0 ? (
                    <div className="no-plans-list">
                      <div className="empty-state-icon-container">
                        {searchTerm ? <FiSearch className="empty-state-icon" /> : <FiInbox className="empty-state-icon" />}
                        <FiX className="empty-state-cross" />
                      </div>
                      <div className="empty-state-content">
                        <h3>{searchTerm ? 'No matches found' : 'No plans available'}</h3>
                        <p>
                          {searchTerm 
                            ? `We couldn't find any plans matching "${searchTerm}". Try a different term or clear your search.` 
                            : "There are no plans matching the selected filter criteria at this time."}
                        </p>
                        <button 
                          onClick={() => {
                            if (searchTerm) setSearchTerm('');
                            setFilterType('all');
                          }} 
                          className="empty-state-action-btn"
                        >
                          {searchTerm ? "Clear Search" : "Show All Plans"}
                        </button>
                      </div>
                    </div>

                  ) : (

                    filteredPlans.map((plan, idx) => (
                      <div key={idx} className="plan-item">
                        <div className="plan-main-info">
                          <div className="plan-header">
                            <h4 className="plan-name">{plan.name}</h4>
                            <div className="plan-price">
                              <span className="price-icon">
                                {currencyOptions.find(c => c.code === (plan.currency || 'usd'))?.symbol || '$'}
                              </span>
                              <span>{plan.price}</span>
                            </div>
                          </div>
                          {plan.description && (
                            <p className="plan-description">{plan.description}</p>
                          )}
                          {/* Plan ID Display */}
                          {plan.planId && (
                            <div className="plan-id-display-list">
                              <span className="plan-id-label">Plan ID:</span>
                              <span className="plan-id-value">{plan.planId}</span>
                              <button 
                                className="copy-id-btn"
                                onClick={() => navigator.clipboard.writeText(plan.planId)}
                                title="Copy Plan ID"
                              >
                                <FiClipboard />
                              </button>
                            </div>
                          )}
                          <div className="plan-meta">
                            <span className={`plan-billing ${plan.billingType === 'RECURRING' ? 'recurring' : ''}`}>
                              <FiCheck className="meta-icon" />
                              {plan.billingType === 'RECURRING' ? 'Recurring' : 'One-Time'}
                            </span>
                            <span className={`plan-status ${plan.isActive ? 'active' : 'inactive'}`}>
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="plan-actions">
                          <button
                            className="plan-edit-btn"
                            onClick={() => startEdit(activeConfig, activeConfig.plans.indexOf(plan))}
                            title="Edit plan"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="plan-delete-btn"
                            onClick={() => showDeleteModal(plan.planId, activeConfig.productId, activeConfig.plans.indexOf(plan))}
                            title="Delete plan"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
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
                      <div className="price-input-row">
                        <div className="currency-selector">
                          <select
                            value={plans[activePlanIndex].currency || 'usd'}
                            onChange={(e) => handlePlanChange(activePlanIndex, 'currency', e.target.value)}
                            className="currency-select"
                          >
                            {currencyOptions.map(currency => (
                              <option key={currency.code} value={currency.code}>
                                {currency.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="price-box">
                          <span className="currency-symbol">
                            {currencyOptions.find(c => c.code === (plans[activePlanIndex].currency || 'usd'))?.symbol || '$'}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={plans[activePlanIndex].price}
                            onChange={(e) => handlePlanChange(activePlanIndex, 'price', e.target.value)}
                            className={errors[`price-${activePlanIndex}`] ? 'error' : ''}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Book ID field - only for E-Book product with one-time payment */}
                    {selectedProduct === '325b5f10-640f-49f4-8ebf-a6aca823233c' && plans[activePlanIndex].billingType === 'ONE_TIME' && (
                      <div className="book-id-section">
                        <label className="section-label">Book Information</label>
                        <div className="field">
                          <label>Book ID*</label>
                          <input
                            type="text"
                            value={plans[activePlanIndex].bookId || ''}
                            onChange={(e) => handlePlanChange(activePlanIndex, 'bookId', e.target.value)}
                            placeholder="Enter unique book identifier"
                            className={errors[`bookId-${activePlanIndex}`] ? 'error' : ''}
                          />
                          {errors[`bookId-${activePlanIndex}`] && (
                            <p className="error-text">{errors[`bookId-${activePlanIndex}`]}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="plan-save-footer">
                      {/* Plan ID Display - Show only after plan is saved */}
                      {plans[activePlanIndex].planId && (
                        <div className="plan-id-save-section">
                          <span className="plan-id-label">PLAN ID</span>
                          <div className="plan-id-save-display">
                            <span className="plan-id-value">{plans[activePlanIndex].planId}</span>
                            <button 
                              className="copy-save-btn"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(plans[activePlanIndex].planId);
                                  setCopySuccess('copied');
                                  setTimeout(() => setCopySuccess(null), 2000);
                                } catch (err) {
                                  setCopySuccess('error');
                                  setTimeout(() => setCopySuccess(null), 2000);
                                }
                              }}
                              title="Copy Plan ID"
                            >
                              {copySuccess === 'copied' ? '✅ Copied!' : copySuccess === 'error' ? '❌ Failed' : <><FiClipboard /> Copy</>}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        className={`plan-save-btn ${(plans[activePlanIndex].lastSaved && !plans[activePlanIndex].isModified) ? 'completed' : ''} ${!isCurrentPlanValid() ? 'disabled' : ''}`}
                        onClick={() => handleSavePlan(activePlanIndex)}
                        disabled={plans[activePlanIndex].isSaving || !isCurrentPlanValid()}
                      >
                        {plans[activePlanIndex].isSaving ? 'Saving Changes...' : (plans[activePlanIndex].lastSaved && !plans[activePlanIndex].isModified) ? '✓ Plan Synced' : 'Save Plan Details'}
                      </button>
                      {plans[activePlanIndex].lastSaved && (
                        <span className="sync-time">Last Synced: {plans[activePlanIndex].lastSaved}</span>
                      )}
                      {!isCurrentPlanValid() && (
                        <p className="validation-hint">⚠️ Please fill all required fields before saving</p>
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
                {!plans.every(p => (p.planId || (p.lastSaved && !p.isModified))) && (
                  <p className="save-hint">⚠️ All plans must be saved individually before finalizing.</p>
                )}
                <button
                  type="submit"
                  className={`save-button ${!plans.every(p => (p.planId || (p.lastSaved && !p.isModified))) ? 'disabled' : ''}`}
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

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={hideDeleteModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this plan?</p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={hideDeleteModal}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-delete" onClick={confirmDelete}>
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanCreationForm;
