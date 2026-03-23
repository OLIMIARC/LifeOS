import { neon } from '@neondatabase/serverless';

const sampleData = {
  businesses: [{ id: '1', name: 'Sunny Mini Market', category: 'Retail', owner_id: 'default_owner' }],
  sales: [
    { total_revenue: 12500.5, total_profit: 4200.25, avg_margin: 33.6, item_name: 'Bread', quantity: 50, price: 1.5, cost: 0.8, sale_date: new Date() },
    { item_name: 'Coffee', total_sold: 45, revenue: 675.0 }
  ],
  inventory: [
    { item_name: 'Milk', quantity: 5, reorder_level: 10, unit_cost: 1.2 },
    { item_name: 'Bread', quantity: 50, reorder_level: 20, unit_cost: 0.8 }
  ],
  insights: [
    { content: 'Profit margin on Coffee is strong (33%), consider a bulk discount for regular customers.', type: 'recommendation' },
    { content: 'Milk stock is below reorder level (5 units remaining).', type: 'warning' }
  ],
  alerts: [
    { id: '1', alert_type: 'low_stock', severity: 'critical', message: 'Milk is running out (5 units left)', metadata: {}, is_read: false }
  ],
  actions: [
    { id: '1', action_text: 'Restock Milk soon (only 5 units left)', category: 'inventory', is_completed: false }
  ]
};

const mockSql = (strings, ...values) => {
  const query = strings.join('').toLowerCase();
  
  // Handle SELECT
  if (query.includes('select')) {
    if (query.includes('from businesses')) return Promise.resolve(sampleData.businesses);
    if (query.includes('sum(price * quantity)')) return Promise.resolve([sampleData.sales[0]]);
    if (query.includes('group by item_name')) return Promise.resolve([sampleData.sales[1]]);
    if (query.includes('from inventory')) return Promise.resolve(sampleData.inventory);
    if (query.includes('from insights')) return Promise.resolve(sampleData.insights);
    if (query.includes('from alerts')) return Promise.resolve(sampleData.alerts);
    if (query.includes('from actions')) return Promise.resolve(sampleData.actions);
  }

  // Handle INSERT / UPDATE (Mock success)
  if (query.includes('insert into businesses') || query.includes('update businesses')) {
    // Attempt to extract name/category from values if possible
    // For simplicity, just return a mock success object that matches expected schema
    return Promise.resolve([{
      id: '1',
      name: values[0] || 'Mock Business',
      category: values[1] || 'Retail',
      owner_id: values[2] || 'default_owner'
    }]);
  }
  
  return Promise.resolve([]);
};

mockSql.transaction = (cb) => cb(mockSql);

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : mockSql;

export default sql;