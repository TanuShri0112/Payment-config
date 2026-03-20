# Product Plan API Integration

## Overview
This frontend has been integrated with the Product Plan backend API to provide full CRUD functionality for managing product pricing plans.

## API Endpoints

### Base URL
```
http://localhost:3000/api/product-plans
```
(Configure via `REACT_APP_API_URL` environment variable)

### Available Operations

#### 1. Create Plan
- **Method**: `POST`
- **Endpoint**: `/`
- **Usage**: Creates a new product plan
- **Request Body**:
```json
{
  "productId": "course",
  "name": "Basic Plan",
  "description": "Entry-level plan",
  "price": 99,
  "currency": "USD",
  "billingType": "RECURRING",
  "interval": "MONTH",
  "intervalCount": 1,
  "isActive": true,
  "metadata": {}
}
```

#### 2. Get All Plans
- **Method**: `GET`
- **Endpoint**: `/`
- **Query Parameters**: `?productName=Course` (optional filter)
- **Usage**: Retrieves all plans, optionally filtered by product name

#### 3. Get Plan by ID
- **Method**: `GET`
- **Endpoint**: `/:id`
- **Usage**: Retrieves a specific plan by its ID

#### 4. Update Plan
- **Method**: `PUT`
- **Endpoint**: `/:id`
- **Usage**: Updates an existing plan
- **Request Body**: Same as create plan

#### 5. Delete Plan
- **Method**: `DELETE`
- **Endpoint**: `/:id`
- **Usage**: Deletes a specific plan

## Frontend Features

### 1. Plan Management
- **Create**: Add new plans with automatic API integration
- **Read**: Load existing plans from backend on component mount
- **Update**: Edit existing plans with automatic detection (create vs update)
- **Delete**: Remove plans with confirmation dialog

### 2. Product Support
The frontend supports these products:
- AI Powered Course Creation
- Designova
- Athenora Live
- E-Book Athena
- Operon AI: ChatBot Agent
- Athena LMS
- Buildora

### 3. Plan Configuration
- **Name**: Display name for the plan
- **Description**: Detailed description (200 char limit)
- **Price**: Numeric pricing in USD
- **Billing Type**: One-time or Recurring
- **Interval**: MONTH, YEAR, DAY, WEEK (for recurring)
- **Interval Count**: Number of intervals (e.g., every 2 months)
- **Active Status**: Enable/disable plans

### 4. User Interface
- **List View**: Browse all configured products and their plans
- **Edit View**: Create/edit plans with tabbed interface
- **Real-time Validation**: Input validation with error messages
- **Save Status**: Visual indicators for save/sync status
- **Auto-switching**: Automatically move to next plan after saving

## API Service

The `productPlanService.js` file handles all API communications:

```javascript
import productPlanService from '../services/productPlanService';

// Create a plan
await productPlanService.createPlan(planData);

// Get all plans
await productPlanService.getAllPlans(productName);

// Get plan by ID
await productPlanService.getPlanById(id);

// Update plan
await productPlanService.updatePlan(id, planData);

// Delete plan
await productPlanService.deletePlan(id);
```

## Error Handling

- **Network Errors**: Caught and displayed to user
- **Validation Errors**: Backend validation messages shown
- **Loading States**: Visual feedback during API calls
- **Success Messages**: Confirmation on successful operations

## Data Flow

1. **Component Mount**: Loads existing plans from backend
2. **Plan Creation**: Validates data → Calls API → Updates local state
3. **Plan Update**: Detects existing ID → Calls update API → Updates state
4. **Plan Deletion**: Confirmation dialog → Calls delete API → Removes from state

## Environment Configuration

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://your-backend-url/api/product-plans
```

If not configured, defaults to `http://localhost:3000/api/product-plans`.

## Special Features

### E-book Product Handling
The backend has special handling for E-book products (`EBOOK_PRODUCT_ID`). The frontend automatically detects and handles this case.

### Metadata Support
All plans support a `metadata` field for additional configuration data. Currently empty but ready for future enhancements.

### Product Filtering
Plans can be filtered by product name when fetching all plans, useful for large datasets.
