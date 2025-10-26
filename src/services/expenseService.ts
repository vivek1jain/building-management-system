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
import { handleServiceError } from '../utils/errorHandling';
import { fromFirestoreTimestamp, toFirestoreTimestamp, toOptionalFirestoreTimestamp } from '../utils/firestore';

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
        createdAt: toFirestoreTimestamp(expense.createdAt),
        updatedAt: toFirestoreTimestamp(expense.updatedAt),
        date: toFirestoreTimestamp(expense.date),
        expectedInvoiceDate: toOptionalFirestoreTimestamp(expense.expectedInvoiceDate),
        matchedAt: toOptionalFirestoreTimestamp(expense.matchedAt),
      });

      return docRef.id;
    } catch (error) {
      handleServiceError('Error creating forecast expense', error, {
        service: 'expenseService',
        operation: 'createForecastExpense'
      });
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
      categoryId: '', // Will be set based on budget category
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
    try {
      const q = query(
        collection(db, 'expenses'),
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
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
        
        try {
          // Fallback query without orderBy to avoid index requirement
          const fallbackQuery = query(
            collection(db, 'expenses'),
            where('buildingId', '==', buildingId)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          
          // Process and manually sort by createdAt in JavaScript
          const expenses = this.processExpenseDocuments(fallbackSnapshot);
          
          // Sort manually by createdAt descending
          expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
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
      return [];
    }

    const expenses = querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      
      try {
        return {
          id: doc.id,
          ...data,
          date: fromFirestoreTimestamp(data.date),
          createdAt: fromFirestoreTimestamp(data.createdAt),
          updatedAt: fromFirestoreTimestamp(data.updatedAt),
          expectedInvoiceDate: data.expectedInvoiceDate ? fromFirestoreTimestamp(data.expectedInvoiceDate) : undefined,
          matchedAt: data.matchedAt ? fromFirestoreTimestamp(data.matchedAt) : undefined,
        } as Expense;
      } catch (docError: any) {
        console.error(`❌ Error processing expense document ${doc.id}:`, docError);
        console.error('❌ Document data that failed:', data);
        throw new Error(`Failed to process expense document ${doc.id}: ${docError.message}`);
      }
    });
    
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
          date: fromFirestoreTimestamp(data.date),
          createdAt: fromFirestoreTimestamp(data.createdAt),
          updatedAt: fromFirestoreTimestamp(data.updatedAt),
          expectedInvoiceDate: data.expectedInvoiceDate ? fromFirestoreTimestamp(data.expectedInvoiceDate) : undefined,
          matchedAt: data.matchedAt ? fromFirestoreTimestamp(data.matchedAt) : undefined,
        } as Expense;
      });
    } catch (error) {
      handleServiceError('Error fetching forecast expenses', error, {
        service: 'expenseService',
        operation: 'getForecastExpenses',
        metadata: { buildingId }
      });
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
        date: fromFirestoreTimestamp(data.date),
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
        expectedInvoiceDate: data.expectedInvoiceDate ? fromFirestoreTimestamp(data.expectedInvoiceDate) : undefined,
        matchedAt: data.matchedAt ? fromFirestoreTimestamp(data.matchedAt) : undefined,
      } as Expense;
    } catch (error) {
      handleServiceError('Error fetching expense by ticket ID', error, {
        service: 'expenseService',
        operation: 'getExpenseByTicketId',
        metadata: { ticketId }
      });
      throw error;
    }
  },

  // Update expense (e.g., when matching to invoice)
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: toFirestoreTimestamp(new Date()),
      };

      // Convert dates to Timestamps for Firestore storage
      if (updates.date) {
        updateData.date = toFirestoreTimestamp(updates.date);
      }
      if (updates.expectedInvoiceDate) {
        updateData.expectedInvoiceDate = toFirestoreTimestamp(updates.expectedInvoiceDate);
      }
      if (updates.matchedAt) {
        updateData.matchedAt = toFirestoreTimestamp(updates.matchedAt);
      }

      // Calculate variance if both amounts are provided
      if (updates.actualAmount && updates.amount) {
        updateData.variance = updates.actualAmount - updates.amount;
      }

      await updateDoc(doc(db, 'expenses', expenseId), updateData);
    } catch (error) {
      handleServiceError('Error updating expense', error, {
        service: 'expenseService',
        operation: 'updateExpense',
        metadata: { expenseId }
      });
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
    } catch (error) {
      handleServiceError('Error matching expense to invoice', error, {
        service: 'expenseService',
        operation: 'matchExpenseToInvoice',
        metadata: { expenseId, invoiceId }
      });
      throw error;
    }
  },

  // Mark expense as invoiced (when invoice is received)
  async markAsInvoiced(expenseId: string, userId: string, invoiceId?: string): Promise<void> {
    try {
      const updates: Partial<Expense> = {
        status: 'invoiced',
        matchedAt: new Date(),
      };
      
      // Link to invoice if provided
      if (invoiceId) {
        updates.matchedToInvoiceId = invoiceId;
      }
      
      await this.updateExpense(expenseId, updates);
    } catch (error) {
      handleServiceError('Error marking expense as invoiced', error, {
        service: 'expenseService',
        operation: 'markAsInvoiced',
        metadata: { expenseId, invoiceId }
      });
      throw error;
    }
  },

  // Mark expense as paid
  async markExpenseAsPaid(expenseId: string): Promise<void> {
    try {
      await this.updateExpense(expenseId, {
        status: 'paid',
      });
    } catch (error) {
      handleServiceError('Error marking expense as paid', error, {
        service: 'expenseService',
        operation: 'markExpenseAsPaid',
        metadata: { expenseId }
      });
      throw error;
    }
  },

  // Delete expense
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleServiceError('Error deleting expense', error, {
        service: 'expenseService',
        operation: 'deleteExpense',
        metadata: { expenseId }
      });
      throw error;
    }
  },

  // Get total forecast amount for building (for cash flow calculations)
  async getTotalForecastAmount(buildingId: string): Promise<number> {
    try {
      const forecastExpenses = await this.getForecastExpenses(buildingId);
      return forecastExpenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      handleServiceError('Error calculating total forecast amount', error, {
        service: 'expenseService',
        operation: 'getTotalForecastAmount',
        metadata: { buildingId }
      });
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
            date: fromFirestoreTimestamp(data.date),
            createdAt: fromFirestoreTimestamp(data.createdAt),
            updatedAt: fromFirestoreTimestamp(data.updatedAt),
            expectedInvoiceDate: data.expectedInvoiceDate ? fromFirestoreTimestamp(data.expectedInvoiceDate) : undefined,
            matchedAt: data.matchedAt ? fromFirestoreTimestamp(data.matchedAt) : undefined,
          } as Expense;
        })
        .filter(expense => expense.variance && Math.abs(expense.variance) > 0);
    } catch (error) {
      handleServiceError('Error fetching expenses with variance', error, {
        service: 'expenseService',
        operation: 'getExpensesWithVariance',
        metadata: { buildingId }
      });
      throw error;
    }
  }
};
