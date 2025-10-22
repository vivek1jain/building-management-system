import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Expense } from '../types';

export const expenseService = {
  // Create a new forecast expense (typically when a ticket is completed)
  async createForecastExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const expense: Omit<Expense, 'id'> = {
        ...expenseData,
        status: 'forecast',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: Timestamp.fromDate(expense.createdAt),
        updatedAt: Timestamp.fromDate(expense.updatedAt),
        date: Timestamp.fromDate(expense.date),
        expectedInvoiceDate: expense.expectedInvoiceDate ? Timestamp.fromDate(expense.expectedInvoiceDate) : null,
        matchedAt: expense.matchedAt ? Timestamp.fromDate(expense.matchedAt) : null,
      });

      console.log('Created forecast expense:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating forecast expense:', error);
      throw error;
    }
  },

  // Create forecast expense from completed ticket
  async createExpenseFromTicket(
    ticketId: string,
    buildingId: string,
    amount: number,
    vendorId: string,
    vendorName: string,
    description: string,
    budgetCategory: string = 'Maintenance & Repairs', // Default category - matches budget category master
    createdBy: string
  ): Promise<string> {
    const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      buildingId,
      budgetId: '', // Will need to be set based on building's current budget
      category: budgetCategory, // Use category field to match budget categories by name
      ticketId,
      amount,
      currency: 'GBP', // Default to GBP for UK market
      description: `Ticket Completion: ${description}`,
      date: new Date(),
      vendorId,
      vendorName,
      status: 'forecast',
      forecastReason: 'ticket_completion',
      expectedInvoiceDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      createdBy,
    };

    return this.createForecastExpense(expenseData);
  },

  // Get all expenses for a building
  async getExpensesByBuilding(buildingId: string): Promise<Expense[]> {
    console.log('🔍 expenseService.getExpensesByBuilding called with buildingId:', buildingId);
    
    try {
      console.log('📄 Creating primary Firestore query with orderBy...');
      const q = query(
        collection(db, 'expenses'),
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
      );
      console.log('✅ Primary query created successfully');

      console.log('🔄 Executing primary Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('📊 Primary query completed, found', querySnapshot.docs.length, 'expense documents');
      
      return this.processExpenseDocuments(querySnapshot);
      
    } catch (error) {
      console.error('❌ Primary query failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        buildingId,
        errorType: error.constructor.name
      });
      
      // Check for specific Firebase errors
      if (error.code === 'failed-precondition') {
        console.error('🚫 FAILED-PRECONDITION: Composite index required for buildingId + createdAt');
        console.log('🔄 Attempting fallback query without orderBy...');
        
        try {
          // Fallback query without orderBy to avoid index requirement
          const fallbackQuery = query(
            collection(db, 'expenses'),
            where('buildingId', '==', buildingId)
          );
          console.log('✅ Fallback query created successfully');
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          console.log('📊 Fallback query completed, found', fallbackSnapshot.docs.length, 'expense documents');
          
          // Process and manually sort by createdAt in JavaScript
          const expenses = this.processExpenseDocuments(fallbackSnapshot);
          
          // Sort manually by createdAt descending
          expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          console.log('✅ Fallback query successful, manually sorted expenses');
          return expenses;
          
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
        
      } else if (error.code === 'permission-denied') {
        console.error('🚫 PERMISSION-DENIED: Check Firestore security rules for expenses collection');
        throw error;
      } else if (error.code === 'unavailable') {
        console.error('📡 FIREBASE UNAVAILABLE: Check network connection');
        throw error;
      } else {
        throw error;
      }
    }
  },
  
  // Helper method to process expense documents
  processExpenseDocuments(querySnapshot: any): Expense[] {
    if (querySnapshot.empty) {
      console.log('ℹ️ No expenses found');
      return [];
    }

    console.log('🔄 Processing expense documents...');
    const expenses = querySnapshot.docs.map((doc: any, index: number) => {
      console.log(`📄 Processing expense ${index + 1}/${querySnapshot.docs.length}: ${doc.id}`);
      const data = doc.data();
      console.log('📋 Raw expense data:', {
        id: doc.id,
        hasDate: !!data.date,
        hasCreatedAt: !!data.createdAt,
        hasUpdatedAt: !!data.updatedAt,
        status: data.status,
        amount: data.amount,
        description: data.description
      });
      
      try {
        const processedExpense = {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          expectedInvoiceDate: data.expectedInvoiceDate?.toDate ? data.expectedInvoiceDate.toDate() : (data.expectedInvoiceDate ? new Date(data.expectedInvoiceDate) : undefined),
          matchedAt: data.matchedAt?.toDate ? data.matchedAt.toDate() : (data.matchedAt ? new Date(data.matchedAt) : undefined),
        } as Expense;
        
        console.log('✅ Processed expense successfully:', {
          id: processedExpense.id,
          amount: processedExpense.amount,
          status: processedExpense.status,
          createdAt: processedExpense.createdAt
        });
        
        return processedExpense;
      } catch (docError: any) {
        console.error(`❌ Error processing expense document ${doc.id}:`, docError);
        console.error('❌ Document data that failed:', data);
        throw new Error(`Failed to process expense document ${doc.id}: ${docError.message}`);
      }
    });
    
    console.log('✅ Successfully processed all expenses, returning', expenses.length, 'expenses');
    return expenses;
  },

  // Get forecast expenses (for cash flow calculations)
  async getForecastExpenses(buildingId: string): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('buildingId', '==', buildingId),
        where('status', '==', 'forecast'),
        orderBy('expectedInvoiceDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          expectedInvoiceDate: data.expectedInvoiceDate?.toDate() || undefined,
          matchedAt: data.matchedAt?.toDate() || undefined,
        } as Expense;
      });
    } catch (error) {
      console.error('Error fetching forecast expenses:', error);
      throw error;
    }
  },

  // Get expense by ticket ID
  async getExpenseByTicketId(ticketId: string): Promise<Expense | null> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('ticketId', '==', ticketId)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        expectedInvoiceDate: data.expectedInvoiceDate?.toDate() || undefined,
        matchedAt: data.matchedAt?.toDate() || undefined,
      } as Expense;
    } catch (error) {
      console.error('Error fetching expense by ticket ID:', error);
      throw error;
    }
  },

  // Update expense (e.g., when matching to invoice)
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Convert dates to Timestamps for Firestore storage
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }
      if (updates.expectedInvoiceDate) {
        updateData.expectedInvoiceDate = Timestamp.fromDate(updates.expectedInvoiceDate);
      }
      if (updates.matchedAt) {
        updateData.matchedAt = Timestamp.fromDate(updates.matchedAt);
      }

      // Calculate variance if both amounts are provided
      if (updates.actualAmount && updates.amount) {
        updateData.variance = updates.actualAmount - updates.amount;
      }

      await updateDoc(doc(db, 'expenses', expenseId), updateData);
      console.log('Updated expense:', expenseId);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Match expense to invoice (when invoice is received)
  async matchExpenseToInvoice(
    expenseId: string,
    invoiceId: string,
    actualAmount: number
  ): Promise<void> {
    try {
      const updates: Partial<Expense> = {
        status: 'invoiced',
        matchedToInvoiceId: invoiceId,
        matchedAt: new Date(),
        actualAmount,
      };

      await this.updateExpense(expenseId, updates);
      console.log(`Matched expense ${expenseId} to invoice ${invoiceId}`);
    } catch (error) {
      console.error('Error matching expense to invoice:', error);
      throw error;
    }
  },

  // Mark expense as invoiced (when invoice is received)
  async markAsInvoiced(expenseId: string, userId: string): Promise<void> {
    try {
      await this.updateExpense(expenseId, {
        status: 'invoiced',
        matchedAt: new Date(),
      });
      console.log('Marked expense as invoiced:', expenseId);
    } catch (error) {
      console.error('Error marking expense as invoiced:', error);
      throw error;
    }
  },

  // Mark expense as paid
  async markExpenseAsPaid(expenseId: string): Promise<void> {
    try {
      await this.updateExpense(expenseId, {
        status: 'paid',
      });
      console.log('Marked expense as paid:', expenseId);
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      throw error;
    }
  },

  // Delete expense
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      console.log('Deleted expense:', expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Get total forecast amount for building (for cash flow calculations)
  async getTotalForecastAmount(buildingId: string): Promise<number> {
    try {
      const forecastExpenses = await this.getForecastExpenses(buildingId);
      return forecastExpenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      console.error('Error calculating total forecast amount:', error);
      throw error;
    }
  },

  // Get expenses with variance (actual vs forecast)
  async getExpensesWithVariance(buildingId: string): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('buildingId', '==', buildingId),
        where('status', 'in', ['invoiced', 'paid']),
        orderBy('matchedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            expectedInvoiceDate: data.expectedInvoiceDate?.toDate() || undefined,
            matchedAt: data.matchedAt?.toDate() || undefined,
          } as Expense;
        })
        .filter(expense => expense.variance && Math.abs(expense.variance) > 0);
    } catch (error) {
      console.error('Error fetching expenses with variance:', error);
      throw error;
    }
  }
};
