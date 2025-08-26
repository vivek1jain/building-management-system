import { db } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export class TestDataService {
  // Delete all tickets
  static async deleteAllTickets(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const ticketsRef = collection(db, 'tickets');
      const snapshot = await getDocs(ticketsRef);
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting tickets:', error);
      return { 
        success: false, 
        deletedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete all expenses
  static async deleteAllExpenses(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const expensesRef = collection(db, 'expenses');
      const snapshot = await getDocs(expensesRef);
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting expenses:', error);
      return { 
        success: false, 
        deletedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete all events
  static async deleteAllEvents(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const eventsRef = collection(db, 'buildingEvents');
      const snapshot = await getDocs(eventsRef);
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting events:', error);
      return { 
        success: false, 
        deletedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Delete all income records
  static async deleteAllIncome(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const incomeRef = collection(db, 'income');
      const snapshot = await getDocs(incomeRef);
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting income records:', error);
      return { 
        success: false, 
        deletedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get collection counts for dashboard
  static async getCollectionCounts(): Promise<{
    tickets: number;
    expenses: number;
    events: number;
    income: number;
  }> {
    console.log('🔍 TestDataService: Starting collection counts...');
    
    try {
      console.log('📊 Fetching collection snapshots...');
      const [ticketsSnapshot, expensesSnapshot, eventsSnapshot, incomeSnapshot] = await Promise.all([
        getDocs(collection(db, 'tickets')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'buildingEvents')),
        getDocs(collection(db, 'income'))
      ]);

      const counts = {
        tickets: ticketsSnapshot.size,
        expenses: expensesSnapshot.size,
        events: eventsSnapshot.size,
        income: incomeSnapshot.size
      };
      
      console.log('📊 Collection counts retrieved:', counts);
      console.log('📄 Detailed breakdown:', {
        tickets: {
          count: ticketsSnapshot.size,
          sampleIds: ticketsSnapshot.docs.slice(0, 3).map(doc => doc.id),
          hasData: !ticketsSnapshot.empty
        },
        expenses: {
          count: expensesSnapshot.size,
          sampleIds: expensesSnapshot.docs.slice(0, 3).map(doc => doc.id),
          hasData: !expensesSnapshot.empty
        },
        events: {
          count: eventsSnapshot.size,
          sampleIds: eventsSnapshot.docs.slice(0, 3).map(doc => doc.id),
          hasData: !eventsSnapshot.empty
        },
        income: {
          count: incomeSnapshot.size,
          sampleIds: incomeSnapshot.docs.slice(0, 3).map(doc => doc.id),
          hasData: !incomeSnapshot.empty
        }
      });

      return counts;
    } catch (error) {
      console.error('❌ Error getting collection counts:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        name: (error as any).name
      });
      
      // Return zeros on error but log the issue
      return {
        tickets: 0,
        expenses: 0,
        events: 0,
        income: 0
      };
    }
  }

  // Delete all test data (combination of all collections)
  static async deleteAllTestData(): Promise<{ 
    success: boolean; 
    results: { 
      tickets: number; 
      expenses: number; 
      events: number; 
      income: number; 
    }; 
    errors: string[];
  }> {
    const results = { tickets: 0, expenses: 0, events: 0, income: 0 };
    const errors: string[] = [];

    try {
      const [ticketsResult, expensesResult, eventsResult, incomeResult] = await Promise.all([
        this.deleteAllTickets(),
        this.deleteAllExpenses(),
        this.deleteAllEvents(),
        this.deleteAllIncome()
      ]);

      if (ticketsResult.success) {
        results.tickets = ticketsResult.deletedCount;
      } else if (ticketsResult.error) {
        errors.push(`Tickets: ${ticketsResult.error}`);
      }

      if (expensesResult.success) {
        results.expenses = expensesResult.deletedCount;
      } else if (expensesResult.error) {
        errors.push(`Expenses: ${expensesResult.error}`);
      }

      if (eventsResult.success) {
        results.events = eventsResult.deletedCount;
      } else if (eventsResult.error) {
        errors.push(`Events: ${eventsResult.error}`);
      }

      if (incomeResult.success) {
        results.income = incomeResult.deletedCount;
      } else if (incomeResult.error) {
        errors.push(`Income: ${incomeResult.error}`);
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error) {
      console.error('Error in deleteAllTestData:', error);
      return {
        success: false,
        results,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
}
