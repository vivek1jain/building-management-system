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
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BudgetCategoryMaster } from '../types';

const COLLECTION_NAME = 'budgetCategoryMasters';

// Default expense categories for new buildings
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Insurance', description: 'Building and public liability insurance' },
  { name: 'Maintenance & Repairs', description: 'General maintenance and repair work' },
  { name: 'Cleaning', description: 'Common area cleaning services' },
  { name: 'Utilities', description: 'Electricity, gas, water for common areas' },
  { name: 'Management Fees', description: 'Property management company fees' },
  { name: 'Reserve Fund', description: 'Contributions to sinking fund' },
  { name: 'Security', description: 'Security services and systems' },
  { name: 'Landscaping', description: 'Garden and grounds maintenance' },
  { name: 'Professional Services', description: 'Legal, accounting, surveying fees' },
  { name: 'Other', description: 'Miscellaneous expenses' }
];

/**
 * Get all active budget category masters for a building
 */
export const getBudgetCategoryMasters = async (buildingId: string): Promise<BudgetCategoryMaster[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('buildingId', '==', buildingId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as BudgetCategoryMaster[];
  } catch (error) {
    console.error('Error fetching budget category masters:', error);
    throw error;
  }
};

/**
 * Get a single budget category master by ID
 */
export const getBudgetCategoryMaster = async (id: string): Promise<BudgetCategoryMaster | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as BudgetCategoryMaster;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching budget category master:', error);
    throw error;
  }
};

/**
 * Create a new budget category master
 */
export const createBudgetCategoryMaster = async (
  categoryData: Omit<BudgetCategoryMaster, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating budget category master:', error);
    throw error;
  }
};

/**
 * Update an existing budget category master
 */
export const updateBudgetCategoryMaster = async (
  id: string,
  updates: Partial<Omit<BudgetCategoryMaster, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // If name is being updated, track it in historicalNames
    const existingDoc = await getDoc(docRef);
    if (existingDoc.exists() && updates.name) {
      const existingData = existingDoc.data() as BudgetCategoryMaster;
      const currentName = existingData.name;
      
      if (currentName !== updates.name) {
        const historicalNames = existingData.historicalNames || [];
        if (!historicalNames.includes(currentName)) {
          updates.historicalNames = [...historicalNames, currentName];
        }
      }
    }
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating budget category master:', error);
    throw error;
  }
};

/**
 * Soft delete a budget category master (mark as inactive)
 */
export const deleteBudgetCategoryMaster = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error deleting budget category master:', error);
    throw error;
  }
};

/**
 * Merge two budget category masters
 */
export const mergeBudgetCategoryMasters = async (
  sourceId: string,
  targetId: string,
  newName?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Update source category to point to target
    const sourceRef = doc(db, COLLECTION_NAME, sourceId);
    batch.update(sourceRef, {
      isActive: false,
      mergedIntoId: targetId,
      updatedAt: serverTimestamp()
    });
    
    // Optionally update target name
    if (newName) {
      const targetRef = doc(db, COLLECTION_NAME, targetId);
      batch.update(targetRef, {
        name: newName,
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error merging budget category masters:', error);
    throw error;
  }
};

/**
 * Initialize default budget categories for a new building
 */
export const initializeDefaultCategories = async (buildingId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    DEFAULT_EXPENSE_CATEGORIES.forEach(category => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        ...category,
        buildingId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error initializing default categories:', error);
    throw error;
  }
};

/**
 * Search budget category masters by name
 */
export const searchBudgetCategoryMasters = async (
  buildingId: string,
  searchTerm: string
): Promise<BudgetCategoryMaster[]> => {
  try {
    const categories = await getBudgetCategoryMasters(buildingId);
    
    const searchLower = searchTerm.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower) ||
      category.historicalNames?.some(name => 
        name.toLowerCase().includes(searchLower)
      )
    );
  } catch (error) {
    console.error('Error searching budget category masters:', error);
    throw error;
  }
};

export default {
  getBudgetCategoryMasters,
  getBudgetCategoryMaster,
  createBudgetCategoryMaster,
  updateBudgetCategoryMaster,
  deleteBudgetCategoryMaster,
  mergeBudgetCategoryMasters,
  initializeDefaultCategories,
  searchBudgetCategoryMasters
};