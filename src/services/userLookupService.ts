import { 
  collection, 
  query, 
  where, 
  getDocs,
  limit 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Person } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

// In-memory cache to avoid repeated Firestore queries
const userCache = new Map<string, string>();

/**
 * Gets a person's display name by their Firebase UID
 * First tries cache, then searches the people collection
 */
export const getUserDisplayName = async (uid: string): Promise<string> => {
  // Return cached value if available
  if (userCache.has(uid)) {
    return userCache.get(uid)!;
  }

  try {
    // Search for person by UID in people collection
    const peopleRef = collection(db, 'people');
    const q = query(
      peopleRef,
      where('uid', '==', uid),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const personDoc = querySnapshot.docs[0];
      const personData = personDoc.data() as Person;
      const displayName = personData.name;
      
      // Cache the result
      userCache.set(uid, displayName);
      return displayName;
    }
    
    // If not found in people collection, return a fallback
    const fallback = `User ${uid.substring(0, 8)}...`;
    userCache.set(uid, fallback);
    return fallback;
    
  } catch (error) {
    console.error('Error getting user display name:', error);
    // Return a safe fallback on error
    const fallback = `User ${uid.substring(0, 8)}...`;
    userCache.set(uid, fallback);
    return fallback;
  }
};

/**
 * Gets multiple user display names efficiently
 * Uses batch queries and caching
 */
export const getUserDisplayNames = async (uids: string[]): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  const uncachedUids: string[] = [];

  // Check cache first
  for (const uid of uids) {
    if (userCache.has(uid)) {
      result[uid] = userCache.get(uid)!;
    } else {
      uncachedUids.push(uid);
    }
  }

  // Fetch uncached UIDs
  if (uncachedUids.length > 0) {
    try {
      const peopleRef = collection(db, 'people');
      const q = query(
        peopleRef,
        where('uid', 'in', uncachedUids)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Process found users
      querySnapshot.forEach((doc) => {
        const personData = doc.data() as Person;
        
        if (personData.uid && personData.name) {
          result[personData.uid] = personData.name;
          userCache.set(personData.uid, personData.name);
        }
      });
      
      // Handle users not found in people collection
      for (const uid of uncachedUids) {
        if (!result[uid]) {
          const fallback = `User ${uid.substring(0, 8)}...`;
          result[uid] = fallback;
          userCache.set(uid, fallback);
        }
      }
      
    } catch (error) {
      console.error('Error getting multiple user display names:', error);
      // Provide fallbacks for all uncached UIDs on error
      for (const uid of uncachedUids) {
        const fallback = `User ${uid.substring(0, 8)}...`;
        result[uid] = fallback;
        userCache.set(uid, fallback);
      }
    }
  }

  return result;
};

/**
 * Clears the user cache - useful for testing or when user data changes
 */
export const clearUserCache = (): void => {
  userCache.clear();
};

/**
 * Gets the first name from a full name
 * Handles various name formats gracefully
 */
export const getFirstName = (fullName: string): string => {
  if (!fullName || fullName.trim() === '') {
    return 'Unknown';
  }
  
  const parts = fullName.trim().split(' ');
  return parts[0] || 'Unknown';
};

/**
 * Combined function to get user's first name by UID
 */
export const getUserFirstName = async (uid: string): Promise<string> => {
  const displayName = await getUserDisplayName(uid);
  return getFirstName(displayName);
};
