// Debug script to test expense service methods
import { expenseService } from './src/services/expenseService.js';

async function debugExpenses() {
  console.log('Testing expense service...');
  
  try {
    // Test with a sample building ID - replace with an actual one from your data
    const buildingId = 'test-building-id';
    console.log('Fetching expenses for building:', buildingId);
    
    const expenses = await expenseService.getExpensesByBuilding(buildingId);
    console.log('Expenses fetched successfully:', expenses.length);
    console.log('Sample expense data:', expenses[0]);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

debugExpenses();
