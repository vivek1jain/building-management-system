
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  Timestamp,
  type FieldValue,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
  getCountFromServer,
  onSnapshot,
  writeBatch,
  deleteDoc,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { UserRole, WorkOrderStatus, WorkOrderPriority, type WorkOrder, type UserProfile, type ScheduledEvent, type Supplier, type UpdateSupplierData, type Flat, type UpdateFlatData, type Asset, type Person, PersonStatus, AssetStatus, type UpdateAssetData, type UpdatePersonData, type ServiceChargeDemand, ServiceChargeDemandStatus, PaymentMethod, type RecordPaymentInput, type PaymentRecord, type Expense, type CreateExpenseData, type CreateScheduledEventData, type UpdateScheduledEventData, type QuoteRequest, QuoteRequestStatus, type UserApprovalData, type GlobalFinancialSettings, type FirestoreGlobalFinancialSettings, type CreateServiceChargeDemandsInput, type CreateServiceChargeDemandsOutput, type UserFeedback, type BudgetCategory, type CreateBudgetCategoryData, type Reminder, ReminderSeverity, ReminderPriority, ReminderType, type LogEntry, type Building, type CreateBuildingData } from '@/types';

import { startOfMonth, endOfMonth, toDate, addMonths, subDays, getYear, getMonth, getDate } from 'date-fns';
import { auth } from './config';
import { splitName } from '@/lib/utils';
import { getFinancialYearForDate } from '@/lib/date-utils';

const WORK_ORDERS_COLLECTION = 'workOrders';
const USERS_COLLECTION = 'users';
const SCHEDULED_EVENTS_COLLECTION = 'scheduledEvents';
const SUPPLIERS_COLLECTION = 'suppliers';
const FLATS_COLLECTION = 'flats';
const ASSETS_COLLECTION = 'assets';
const PEOPLE_COLLECTION = 'people';
const SERVICE_CHARGE_DEMANDS_COLLECTION = 'serviceChargeDemands';
const EXPENSES_COLLECTION = 'expenses';
const APPLICATION_CONFIGURATION_COLLECTION = 'applicationConfiguration';
const GLOBAL_FINANCIAL_SETTINGS_DOC_ID = 'globalFinancialSettingsDoc';
const BUDGET_CATEGORIES_COLLECTION = 'budgetCategories';
const REMINDERS_COLLECTION = 'reminders';
const BUILDINGS_COLLECTION = 'buildings';


const WORK_ORDER_PAGE_SIZE = 9;


export type CreateWorkOrderData = {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  flatId?: string;
  assetId?: string;
  supplierId?: string;
  supplierName?: string;
  cost?: number | null;
};

export interface UpdateUserProfileData {
  displayName?: string | null;
  flatId?: string | null;
  flatNumber?: string | null;
  status?: PersonStatus | null;
  accountStatus?: "pending_approval" | "active" | "suspended";
}

interface UserProfileCreationData {
  email: string | null;
  role: UserRole;
  fullName: string;
  flatId: string | null;
  moveInDate: Date;
  status: PersonStatus;
  buildingId: string;
}

export type CreateSupplierData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'buildingId'>;
export type CreateFlatData = Omit<Flat, 'id' | 'createdAt' | 'updatedAt' | 'buildingId'>;
export type CreateAssetData = Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'buildingId'>;
export type CreatePersonData = Omit<Person, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'updatedByUid' | 'buildingId'>;


function cleanDataForFirestore<T extends object>(data: T): Partial<T> {
  const cleanedData = {} as Partial<T>;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key as keyof T];
      if (value !== undefined) {
        cleanedData[key as keyof T] = value;
      }
    }
  }
  return cleanedData;
}


export async function createUserProfileDocument(
  uid: string,
  data: UserProfileCreationData
): Promise<void> {
  const personDocRef = doc(collection(db, PEOPLE_COLLECTION));
  
  let flatNumber: string | null = null;
  if (data.flatId) {
      const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, data.flatId));
      if (flatDoc.exists()) {
          flatNumber = (flatDoc.data() as Flat).flatNumber;
      }
  }

  const personData: Omit<Person, 'id'> & { createdAt: FieldValue } = {
    uid: uid,
    email: data.email,
    role: data.role,
    name: data.fullName, 
    flatId: data.flatId,
    flatNumber: flatNumber,
    status: data.status,
    moveInDate: data.moveInDate ? Timestamp.fromDate(data.moveInDate) : null,
    createdAt: serverTimestamp(),
    createdByUid: uid,
    buildingId: data.buildingId,
  };

  try {
    await setDoc(personDocRef, personData);
  } catch (error) {
    console.error("Error creating person document on signup:", error);
    throw new Error('Could not create person profile.');
  }
}

export async function getPeopleByUid(uid: string): Promise<Person[]> {
  console.log(`[firestore] getPeopleByUid: Querying 'people' for UID: ${uid}`);
  try {
    const q = query(collection(db, PEOPLE_COLLECTION), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.warn(`[firestore] getPeopleByUid: Firestore query returned no documents for UID: ${uid}. This is the likely cause of login failure if a person document should exist.`);
        return [];
    }

    const results = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Person));
    console.log(`[firestore] getPeopleByUid: Successfully found and mapped ${results.length} person document(s).`);
    return results;

  } catch (error) {
    console.error(`[firestore] getPeopleByUid: CRITICAL ERROR fetching person profiles for UID ${uid}:`, error);
    return []; 
  }
}


export async function getPersonByUid(uid: string, buildingId?: string): Promise<Person | null> {
  try {
    const queryConstraints = [where("uid", "==", uid)];
    if (buildingId) {
      queryConstraints.push(where("buildingId", "==", buildingId));
    }
    queryConstraints.push(limit(1));
    
    const q = query(collection(db, PEOPLE_COLLECTION), ...queryConstraints);
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as Person;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching person profile for UID ${uid}:`, error);
    return null; 
  }
}

export async function getPendingApprovalUsers(buildingId: string | null): Promise<Person[]> {
  try {
    const peopleRef = collection(db, PEOPLE_COLLECTION);
    const queryConstraints: any[] = [where('status', '==', PersonStatus.PENDING_APPROVAL), orderBy('createdAt', 'asc')];
    if (buildingId) {
      queryConstraints.unshift(where('buildingId', '==', buildingId));
    }
    const q = query(peopleRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
        } as Person;
    });
  } catch (error) {
    console.error("Error fetching pending approval users:", error);
    return []; 
  }
}

export async function approveUserAccount(targetUid: string, approverUid: string, approvalData: UserApprovalData): Promise<void> {
  try {
    const response = await fetch('/api/auth/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUid, approverUid, approvalData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve user via API.');
    }
    
  } catch (error) {
    console.error("Client-side error in approveUserAccount:", error);
    throw error;
  }
}


export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const peopleRef = collection(db, PEOPLE_COLLECTION);
    const q = query(peopleRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const profiles: UserProfile[] = [];

    for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Person;
        if (!data.uid) continue; 

        const profile: UserProfile = {
          id: docSnap.id,
          uid: data.uid,
          email: data.email || null,
          displayName: splitName(data.name).firstName,
          name: data.name || null,
          photoURL: null,
          role: data.role as UserRole | undefined,
          flatId: data.flatId || null,
          flatNumber: data.flatNumber || null,
          status: data.status || null,
          moveInDate: data.moveInDate ? toDate(data.moveInDate) : null,
          buildingId: data.buildingId
        };
        profiles.push(profile);
    }
    return profiles.filter(profile => !!profile.uid);
  } catch (error) {
    console.error("Error fetching all user profiles:", error);
    return []; 
  }
}

export async function updateUserProfileDocument(
  uid: string,
  data: UpdateUserProfileData
): Promise<void> {
  try {
    const personQuery = query(collection(db, PEOPLE_COLLECTION), where('uid', '==', uid));
    const personSnapshot = await getDocs(personQuery);
    if(personSnapshot.empty) {
        console.warn(`No person document found for UID ${uid} to update.`);
        return;
    }
    const personDocRef = personSnapshot.docs[0].ref;

    const updatePayload: Partial<Person> = {
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (data.displayName !== undefined) {
    }
    if (data.flatId !== undefined) {
        updatePayload.flatId = data.flatId;
        if (data.flatId) {
            const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, data.flatId));
            updatePayload.flatNumber = flatDoc.exists() ? (flatDoc.data() as Flat).flatNumber : null;
        } else {
            updatePayload.flatNumber = null;
        }
    }
    if(data.status !== undefined) {
        updatePayload.status = data.status;
    }
    await updateDoc(personDocRef, cleanDataForFirestore(updatePayload));
  } catch (error) {
    console.error('Error updating person document from profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}


export async function createWorkOrder(
  data: CreateWorkOrderData,
  userId: string, 
  userEmail: string
): Promise<string> {
  try {
    const userProfile = await getPersonByUid(userId);
    if (!userProfile?.buildingId) {
        throw new Error("User is not associated with a building.");
    }
    
    const cleanedData = cleanDataForFirestore(data);
    let flatNumber: string | null = null;
    if (data.flatId) {
        const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, data.flatId));
        if (flatDoc.exists()) {
            flatNumber = (flatDoc.data() as Flat).flatNumber;
        }
    }

    const docRef = await addDoc(collection(db, WORK_ORDERS_COLLECTION), {
      ...cleanedData,
      buildingId: userProfile.buildingId,
      flatNumber: flatNumber,
      status: WorkOrderStatus.TRIAGE, 
      createdByUid: userId,
      createdByUserEmail: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastStatusChangeByUid: userId,
      resolutionNotes: [],
      managerCommunication: [],
      cost: data.cost !== undefined ? data.cost : null,
      quotePrice: null,
      quoteRequests: [],
      resolvedAt: null, 
      userFeedbackLog: [], 
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating work order:', error);
    throw error;
  }
}

export async function getWorkOrdersByUserId(
  buildingId: string,
  userId: string, 
  pageLimit: number = WORK_ORDER_PAGE_SIZE,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ workOrders: WorkOrder[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    const workOrdersRef = collection(db, WORK_ORDERS_COLLECTION);
    let queryConstraints: any[] = [
        where('buildingId', '==', buildingId),
        where('createdByUid', '==', userId),
        orderBy('createdAt', 'desc')
    ];

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }
    queryConstraints.push(limit(pageLimit));

    const q = query(workOrdersRef, ...queryConstraints);

    const querySnapshot = await getDocs(q);
    const workOrders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as WorkOrder));

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { workOrders, lastVisible };
  } catch (error) {
    console.error('Error fetching work orders by user ID:', error);
    return { workOrders: [], lastVisible: null }; 
  }
}


export async function getAllWorkOrders(
  buildingId: string,
  pageLimit: number = WORK_ORDER_PAGE_SIZE,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  statusFilter?: WorkOrderStatus | WorkOrderStatus[] | null
): Promise<{ workOrders: WorkOrder[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    const workOrdersRef = collection(db, WORK_ORDERS_COLLECTION);
    let queryConstraints: any[] = [
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
    ];

    if (statusFilter) {
      if (Array.isArray(statusFilter) && statusFilter.length > 0) {
        queryConstraints.unshift(where('status', 'in', statusFilter));
      } else if (typeof statusFilter === 'string') {
        queryConstraints.unshift(where('status', '==', statusFilter));
      }
    }

    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }
    queryConstraints.push(limit(pageLimit));

    const q = query(workOrdersRef, ...queryConstraints);

    const querySnapshot = await getDocs(q);
    const workOrders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as WorkOrder));

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { workOrders, lastVisible };
  } catch (error) {
    console.error('Error fetching all work orders:', error);
    return { workOrders: [], lastVisible: null };
  }
}

export async function getAllWorkOrdersUnpaginated(buildingId: string): Promise<WorkOrder[]> {
  try {
    const workOrdersRef = collection(db, WORK_ORDERS_COLLECTION);
    const q = query(workOrdersRef, where('buildingId', '==', buildingId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as WorkOrder));
  } catch (error) {
    console.error('Error fetching all work orders (unpaginated):', error);
    return []; 
  }
}


export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  try {
    const docRef = doc(db, WORK_ORDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as WorkOrder;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching work order by ID ${id}:`, error);
    return null;
  }
}

export async function updateWorkOrderFields(
  workOrderId: string,
  actingUserUid: string, 
  dataToUpdate: Partial<Pick<WorkOrder, 'status' | 'resolutionNotes' | 'managerCommunication' | 'flatId' | 'flatNumber' | 'assetId' | 'supplierId' | 'supplierName' | 'quotePrice' | 'cost' | 'scheduledDate' | 'quoteRequests' | 'title' | 'userFeedbackLog' >>
): Promise<void> {
  const workOrderDocRef = doc(db, WORK_ORDERS_COLLECTION, workOrderId);
  const batch = writeBatch(db);

  try {
    const workOrderSnap = await getDoc(workOrderDocRef);
    if (!workOrderSnap.exists()) {
      throw new Error("Ticket not found.");
    }
    const currentWorkOrderData = workOrderSnap.data() as WorkOrder;

    const updatePayload: any = {
        lastStatusChangeByUid: actingUserUid,
        updatedAt: serverTimestamp(),
    };

    const cleanedData = cleanDataForFirestore(dataToUpdate);
    Object.assign(updatePayload, cleanedData);

    const statusChanged = cleanedData.status && cleanedData.status !== currentWorkOrderData.status;
    if (statusChanged) {
        await dismissRemindersForWorkOrder(workOrderId, batch);

        if (cleanedData.status === WorkOrderStatus.AWAITING_USER_FEEDBACK) {
            await createReminder({
                userId: currentWorkOrderData.createdByUid,
                title: `Feedback requested for Ticket #${workOrderId.substring(0, 6)}`,
                description: `A manager has requested your feedback on the ticket: "${currentWorkOrderData.title}".`,
                link: `/work-orders/${workOrderId}`,
                type: ReminderType.USER_FEEDBACK_REQUESTED,
                severity: ReminderSeverity.WARNING,
                buildingId: currentWorkOrderData.buildingId,
                relatedDocId: workOrderId,
                relatedCollection: WORK_ORDERS_COLLECTION,
            }, batch);
        }
    }

    if (cleanedData.status === WorkOrderStatus.RESOLVED) {
        updatePayload.resolvedAt = serverTimestamp();
    } else if (cleanedData.status !== undefined && cleanedData.status !== WorkOrderStatus.RESOLVED && currentWorkOrderData.status === WorkOrderStatus.RESOLVED) {
      updatePayload.resolvedAt = null;
    }
    
    if (dataToUpdate.userFeedbackLog && Array.isArray(dataToUpdate.userFeedbackLog)) {
        updatePayload.userFeedbackLog = arrayUnion(...dataToUpdate.userFeedbackLog);
    }
    if (dataToUpdate.resolutionNotes && Array.isArray(dataToUpdate.resolutionNotes)) {
        updatePayload.resolutionNotes = arrayUnion(...dataToUpdate.resolutionNotes);
    }
    if (dataToUpdate.managerCommunication && Array.isArray(dataToUpdate.managerCommunication)) {
        updatePayload.managerCommunication = arrayUnion(...dataToUpdate.managerCommunication);
    }


    let newFlatNumberForCalendarEvent = currentWorkOrderData.flatNumber;
    if (cleanedData.hasOwnProperty('flatId')) {
      if (cleanedData.flatId) {
        const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, cleanedData.flatId));
        if (flatDoc.exists()) {
          newFlatNumberForCalendarEvent = (flatDoc.data() as Flat).flatNumber;
          updatePayload.flatNumber = newFlatNumberForCalendarEvent;
        } else {
          updatePayload.flatNumber = null;
          newFlatNumberForCalendarEvent = null;
        }
      } else {
        updatePayload.flatId = null;
        updatePayload.flatNumber = null;
        newFlatNumberForCalendarEvent = null;
      }
    } else if (cleanedData.flatNumber !== undefined) {
        newFlatNumberForCalendarEvent = cleanedData.flatNumber;
    }

    if (cleanedData.hasOwnProperty('scheduledDate')) {
      if (cleanedData.scheduledDate instanceof Date || cleanedData.scheduledDate instanceof Timestamp) {
        updatePayload.scheduledDate = cleanedData.scheduledDate;
      } else if (cleanedData.scheduledDate === null) {
        updatePayload.scheduledDate = null;
      }
    }

    if (cleanedData.quoteRequests && Array.isArray(cleanedData.quoteRequests)) {
        updatePayload.quoteRequests = cleanedData.quoteRequests.map(qr => ({ ...qr }));
    }

    batch.update(workOrderDocRef, updatePayload);

    const newTitleForCalendarEvent = cleanedData.title || currentWorkOrderData.title;
    
    let finalScheduledDate: Date | null = null;
    const scheduledDateValue = updatePayload.scheduledDate ?? currentWorkOrderData.scheduledDate;
    if (scheduledDateValue instanceof Timestamp) {
        finalScheduledDate = scheduledDateValue.toDate();
    } else if (scheduledDateValue instanceof Date) {
        finalScheduledDate = scheduledDateValue;
    }


    const calendarEventTitle = `Ticket: ${newTitleForCalendarEvent}${newFlatNumberForCalendarEvent ? ` (${newFlatNumberForCalendarEvent})` : ''}`;
    const eventsQuery = query(collection(db, SCHEDULED_EVENTS_COLLECTION), where('workOrderId', '==', workOrderId));
    const oldEventsSnap = await getDocs(eventsQuery);
    oldEventsSnap.forEach(eventDoc => {
        batch.delete(doc(db, SCHEDULED_EVENTS_COLLECTION, eventDoc.id));
    });

    if (finalScheduledDate && (updatePayload.status === WorkOrderStatus.SCHEDULED || (currentWorkOrderData.status === WorkOrderStatus.SCHEDULED && updatePayload.status === undefined))) {
        const eventData: CreateScheduledEventData = {
            title: calendarEventTitle,
            start: finalScheduledDate,
            end: finalScheduledDate,
            allDay: true,
            buildingId: currentWorkOrderData.buildingId,
            workOrderId: workOrderId,
            flatId: updatePayload.flatId !== undefined ? updatePayload.flatId : currentWorkOrderData.flatId,
            assetId: updatePayload.assetId !== undefined ? updatePayload.assetId : currentWorkOrderData.assetId,
            supplierId: updatePayload.supplierId !== undefined ? updatePayload.supplierId : currentWorkOrderData.supplierId,
            contractorName: updatePayload.supplierName !== undefined ? updatePayload.supplierName : currentWorkOrderData.supplierName,
        };
        const newEventRef = doc(collection(db, SCHEDULED_EVENTS_COLLECTION));
        batch.set(newEventRef, cleanDataForFirestore({
            ...eventData,
            createdByUid: actingUserUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }));
    }

    if (cleanedData.hasOwnProperty('cost')) {
      const newCost = cleanedData.cost;
      const expenseQuery = query(
        collection(db, EXPENSES_COLLECTION),
        where('workOrderId', '==', workOrderId),
        limit(1)
      );
      const existingExpenseSnap = await getDocs(expenseQuery);
      const existingExpenseDoc = existingExpenseSnap.docs[0];

      const currentSupplierId = updatePayload.supplierId !== undefined ? updatePayload.supplierId : currentWorkOrderData.supplierId;
      const currentSupplierName = updatePayload.supplierName !== undefined ? updatePayload.supplierName : currentWorkOrderData.supplierName;

      if (newCost !== undefined && newCost !== null && newCost > 0) {
        const expenseDataObject: Partial<CreateExpenseData> = {
          buildingId: currentWorkOrderData.buildingId,
          description: `Ticket Cost: ${newTitleForCalendarEvent || 'N/A'} (ID: ${workOrderId.substring(0,6)})`,
          amount: newCost,
          date: finalScheduledDate ? Timestamp.fromDate(finalScheduledDate) : currentWorkOrderData.createdAt || Timestamp.now(),
          workOrderId: workOrderId,
          supplierId: currentSupplierId,
          supplierName: currentSupplierName,
          notes: `Auto-generated/updated expense for Ticket ${workOrderId}`,
        };

        if (existingExpenseDoc) {
          batch.update(existingExpenseDoc.ref, cleanDataForFirestore({
            ...expenseDataObject,
            updatedAt: serverTimestamp()
          }));
        } else {
          const newExpenseRef = doc(collection(db, EXPENSES_COLLECTION));
          batch.set(newExpenseRef, cleanDataForFirestore({
            ...expenseDataObject,
            createdByUid: actingUserUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }));
        }
      } else if (newCost === null || newCost === 0) {
        if (existingExpenseDoc) {
          batch.delete(existingExpenseDoc.ref);
        }
      }
    }
    await batch.commit();
  } catch (error) {
    console.error('Error updating work order and linked items:', error);
    throw error;
  }
}


export type WorkOrderStats = {
  [key in WorkOrderStatus]: number;
};

export async function getWorkOrderCountsByStatus(buildingId: string): Promise<WorkOrderStats> {
  const defaultCounts = Object.values(WorkOrderStatus).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as WorkOrderStats);

  if (!buildingId) {
      console.warn("getWorkOrderCountsByStatus called without a buildingId.");
      return defaultCounts;
  }

  try {
    const counts: Partial<WorkOrderStats> = {};
    const workOrdersRef = collection(db, WORK_ORDERS_COLLECTION);
    for (const status of Object.values(WorkOrderStatus)) {
      const q = query(workOrdersRef, where('buildingId', '==', buildingId), where('status', '==', status));
      const snapshot = await getCountFromServer(q);
      counts[status] = snapshot.data().count;
    }
    return { ...defaultCounts, ...counts };
  } catch (error) {
    console.error("Error fetching work order counts by status:", error);
    return defaultCounts;
  }
}

export async function getWorkOrderCountsByStatusForUser(buildingId: string, userId: string): Promise<WorkOrderStats> {
  const defaultCounts = Object.values(WorkOrderStatus).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as WorkOrderStats);

  if (!buildingId || !userId) return defaultCounts;

  try {
    const counts: Partial<WorkOrderStats> = {};
    const workOrdersRef = collection(db, WORK_ORDERS_COLLECTION);
    for (const status of Object.values(WorkOrderStatus)) {
      const q = query(workOrdersRef, where('buildingId', '==', buildingId), where('status', '==', status), where('createdByUid', '==', userId));
      const snapshot = await getCountFromServer(q);
      counts[status] = snapshot.data().count;
    }
    return { ...defaultCounts, ...counts };
  } catch (error) {
    console.error(`Error fetching work order counts for user ${userId}:`, error);
    return defaultCounts;
  }
}


export async function createScheduledEvent(
  data: CreateScheduledEventData,
  userId: string 
): Promise<string> {
  try {
    const creatorProfile = await getPersonByUid(userId); 
    if (!creatorProfile?.buildingId) {
        throw new Error("User creating event has no associated building.");
    }

    const isCreatorManager = creatorProfile?.role === UserRole.MANAGER;

    const firestorePayload: any = {
      ...data,
      buildingId: creatorProfile.buildingId,
      start: data.start instanceof Date ? Timestamp.fromDate(data.start) : data.start,
      end: data.end instanceof Date ? Timestamp.fromDate(data.end) : data.end,
      allDay: data.allDay,
      createdByUid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPrivate: !isCreatorManager, 
      ownerUid: !isCreatorManager ? userId : null,
    };

    const docRef = await addDoc(collection(db, SCHEDULED_EVENTS_COLLECTION), firestorePayload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating scheduled event:', error);
    throw error;
  }
}

export async function updateScheduledEvent(
  eventId: string,
  data: UpdateScheduledEventData,
  userId: string 
): Promise<void> {
  try {
    const eventDocRef = doc(db, SCHEDULED_EVENTS_COLLECTION, eventId);
    const finalUpdatePayload: { [key: string]: any } = {
      updatedByUid: userId,
      updatedAt: serverTimestamp(),
    };
    (Object.keys(data) as Array<keyof UpdateScheduledEventData>).forEach(key => {
      const value = data[key];
      if (value !== undefined) {
        if ((key === 'start' || key === 'end') && value instanceof Date) {
          finalUpdatePayload[key] = Timestamp.fromDate(value);
        } else {
          finalUpdatePayload[key] = value;
        }
      }
    });

    await updateDoc(eventDocRef, cleanDataForFirestore(finalUpdatePayload));
  } catch (error) {
    console.error(`Error updating scheduled event ${eventId}:`, error);
    throw error;
  }
}

export async function getScheduledEventsForPeriod(
  buildingId: string,
  periodStart: Date,
  periodEnd: Date,
  currentUserId?: string 
): Promise<ScheduledEvent[]> {
  try {
    const eventsRef = collection(db, SCHEDULED_EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where('buildingId', '==', buildingId),
      where('start', '<', periodEnd),
      orderBy('start', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs
      .map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          start: (data.start as Timestamp).toDate(),
          end: (data.end as Timestamp).toDate(),
        } as ScheduledEvent;
      })
      .filter(event => {
        if (event.end < periodStart) return false;
        if (event.isPrivate) {
          return event.ownerUid === currentUserId;
        }
        return true;
      });

    return events;
  } catch (error) {
    console.error('Error fetching scheduled events:', error);
    return []; 
  }
}

export async function createSupplier(buildingId: string, data: CreateSupplierData): Promise<string> {
  try {
    const cleanedData = cleanDataForFirestore(data);
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), {
      ...cleanedData,
      buildingId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
}

export async function getSuppliers(buildingId?: string): Promise<Supplier[]> {
  try {
    const queryConstraints = buildingId
      ? [where('buildingId', '==', buildingId), orderBy('name', 'asc')]
      : [orderBy('name', 'asc')];
    
    const q = query(collection(db, SUPPLIERS_COLLECTION), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    const docRef = doc(db, SUPPLIERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Supplier;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching supplier with ID ${id}:`, error);
    return null;
  }
}

export async function updateSupplier(id: string, data: UpdateSupplierData): Promise<void> {
  try {
    const supplierDocRef = doc(db, SUPPLIERS_COLLECTION, id);
    const cleanedData = cleanDataForFirestore(data);
    await updateDoc(supplierDocRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    throw error;
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  try {
    const supplierDocRef = doc(db, SUPPLIERS_COLLECTION, id);
    await deleteDoc(supplierDocRef);
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    throw error;
  }
}

export async function createFlat(buildingId: string, data: CreateFlatData): Promise<string> {
  try {
    const cleanedData = cleanDataForFirestore(data);
    const docRef = await addDoc(collection(db, FLATS_COLLECTION), {
      ...cleanedData,
      buildingId: buildingId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating flat:', error);
    throw error;
  }
}

export async function getFlats(buildingId?: string): Promise<Flat[]> {
  const queryConstraints = buildingId 
    ? [where('buildingId', '==', buildingId), orderBy('flatNumber', 'asc')] 
    : [orderBy('flatNumber', 'asc')];
  try {
    const q = query(collection(db, FLATS_COLLECTION), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flat));
  } catch (error) {
    console.error('Error fetching flats:', error);
    return [];
  }
}

export async function getFlatById(id: string): Promise<Flat | null> {
  try {
    const docRef = doc(db, FLATS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Flat;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching flat with ID ${id}:`, error);
    return null;
  }
}

export async function getFlatByUserEmail(buildingId: string, email: string): Promise<Flat | null> {
  try {
    const q = query(collection(db, PEOPLE_COLLECTION), where('buildingId', '==', buildingId), where('email', '==', email), limit(1));
    const personSnapshot = await getDocs(q);

    if (personSnapshot.empty) {
        return null;
    }
    const personData = personSnapshot.docs[0].data() as Person;
    if (!personData.flatId) {
        return null;
    }
    return await getFlatById(personData.flatId);
  } catch (error) {
    console.error(`Error fetching flat for user email ${email}:`, error);
    return null;
  }
}

export async function updateFlat(id: string, data: UpdateFlatData): Promise<void> {
  try {
    const flatDocRef = doc(db, FLATS_COLLECTION, id);
    const cleanedData = cleanDataForFirestore(data);
    await updateDoc(flatDocRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating flat ${id}:`, error);
    throw error;
  }
}

export async function deleteFlat(id: string): Promise<void> {
  try {
    const flatDocRef = doc(db, FLATS_COLLECTION, id);
    await deleteDoc(flatDocRef);
  } catch (error) {
    console.error(`Error deleting flat ${id}:`, error);
    throw error;
  }
}

export async function createPerson(
  data: Partial<CreatePersonData>, 
  creatorUid: string
): Promise<{action: 'created' | 'updated', message: string}> {
  if (!data.email) throw new Error("Email is required to create or update a person.");
  
  const peopleRef = collection(db, PEOPLE_COLLECTION);
  const q = query(peopleRef, where("email", "==", data.email.toLowerCase().trim()));
  const existingPersonSnapshot = await getDocs(q);

  // If a person with this email already exists
  if (!existingPersonSnapshot.empty) {
    const existingPersonDoc = existingPersonSnapshot.docs[0];
    const existingPerson = existingPersonDoc.data() as Person;

    // Handle Resident logic
    if (existingPerson.role === UserRole.RESIDENT) {
      if (data.buildingId && existingPerson.buildingId !== data.buildingId) {
        throw new Error(`A resident with email ${data.email} already exists in another building.`);
      }
      if (existingPerson.buildingId === data.buildingId) {
        throw new Error(`This resident is already assigned to this building.`);
      }
    }

    // Handle Manager logic
    if (existingPerson.role === UserRole.MANAGER) {
      const newBuildings = data.accessibleBuildingIds || [];
      const currentBuildings = existingPerson.accessibleBuildingIds || [];
      
      const alreadyAssigned = newBuildings.filter(b => currentBuildings.includes(b));
      if (alreadyAssigned.length > 0) {
        throw new Error(`This manager already has access to one or more of the selected buildings.`);
      }

      const mergedBuildingIds = [...new Set([...currentBuildings, ...newBuildings])];
      await updateDoc(existingPersonDoc.ref, { 
        accessibleBuildingIds: mergedBuildingIds,
        updatedAt: serverTimestamp(),
        updatedByUid: creatorUid,
       });
      return { action: 'updated', message: `Manager ${existingPerson.name} updated with access to new buildings.`};
    }
  }

  // If no existing user, create a new one
  const cleanedData = cleanDataForFirestore(data);
  const personRef = doc(collection(db, PEOPLE_COLLECTION));
  
  // Use a mock UID for auth-free mode, but ensure it's unique enough for dev
  const mockUid = `mock-${data.email?.split('@')[0]}-${Math.random().toString(36).substring(2, 7)}`;

  const finalData = {
    ...cleanedData,
    uid: mockUid,
    createdByUid: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByUid: creatorUid,
  };
  await setDoc(personRef, finalData);
  return { action: 'created', message: `Successfully created person: ${data.name}.` };
}

export async function getPeople(buildingId?: string): Promise<Person[]> {
  try {
    const queryConstraints = buildingId
      ? [where('buildingId', '==', buildingId), orderBy('createdAt', 'desc')]
      : [orderBy('createdAt', 'desc')];
      
    const q = query(collection(db, PEOPLE_COLLECTION), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        moveInDate: data.moveInDate,
        moveOutDate: data.moveOutDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Person;
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
}

export async function getFirstPerson(): Promise<Person | null> {
  try {
    const q = query(collection(db, PEOPLE_COLLECTION), orderBy('createdAt', 'asc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as Person;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching first person:`, error);
    return null;
  }
}

export async function getPersonById(id: string): Promise<Person | null> {
  try {
    const docRef = doc(db, PEOPLE_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        moveInDate: data.moveInDate,
        moveOutDate: data.moveOutDate,
      } as Person;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching person with ID ${id}:`, error);
    return null;
  }
}


export async function updatePerson(id: string, editorUid: string, data: UpdatePersonData): Promise<void> {
  // In auth-free mode, if we are trying to update the mock user, just return to prevent errors.
  if (id === 'mock-person-id-1') {
    console.log("[Auth-Free Mode] Simulated updatePerson for mock user.");
    return Promise.resolve();
  }

  const personDocRef = doc(db, PEOPLE_COLLECTION, id);
  const batch = writeBatch(db);

  try {
    const personSnap = await getDoc(personDocRef);
    if (!personSnap.exists()) throw new Error("Person record not found.");
    const currentPersonData = personSnap.data() as Person;

    const personUpdatePayload: any = {
      updatedByUid: editorUid,
      updatedAt: serverTimestamp(),
    };

    const targetFullNameForPeopleDoc = data.name !== undefined ? data.name : currentPersonData.name;
    if (data.name !== undefined) {
        personUpdatePayload.name = targetFullNameForPeopleDoc;
    }

    if (data.email !== undefined) personUpdatePayload.email = data.email;
    if (data.phone !== undefined) personUpdatePayload.phone = data.phone;
    if (data.isPrimaryContact !== undefined) personUpdatePayload.isPrimaryContact = data.isPrimaryContact;
    if (data.notes !== undefined) personUpdatePayload.notes = data.notes;

    if (data.moveInDate) personUpdatePayload.moveInDate = data.moveInDate instanceof Date ? Timestamp.fromDate(data.moveInDate) : data.moveInDate;
    else if (data.moveInDate === null) personUpdatePayload.moveInDate = null;

    if (data.moveOutDate) personUpdatePayload.moveOutDate = data.moveOutDate instanceof Date ? Timestamp.fromDate(data.moveOutDate) : data.moveOutDate;
    else if (data.moveOutDate === null) personUpdatePayload.moveOutDate = null;

    if (data.flatId !== undefined) {
        personUpdatePayload.flatId = data.flatId;
        if (data.flatId) {
            const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, data.flatId));
            personUpdatePayload.flatNumber = flatDoc.exists() ? (flatDoc.data() as Flat).flatNumber : null;
        } else {
            personUpdatePayload.flatNumber = null;
        }
    }

    if (data.status !== undefined) {
        personUpdatePayload.status = data.status;
    }
    
    // This is new - if a buildingId is passed, update it.
    if ('buildingId' in data && data.buildingId !== undefined) {
      personUpdatePayload.buildingId = data.buildingId;
    }

    batch.update(personDocRef, cleanDataForFirestore(personUpdatePayload));
    
    await batch.commit();
  } catch (error) {
    console.error(`Error updating person ${id}:`, error);
    throw error;
  }
}

export async function deletePerson(id: string): Promise<void> {
  try {
    const personDocRef = doc(db, PEOPLE_COLLECTION, id);
    await deleteDoc(personDocRef);
  } catch (error) {
    console.error(`Error deleting person ${id}:`, error);
    throw error;
  }
}

export async function updatePersonStatus(personId: string, status: PersonStatus, editorUid: string): Promise<void> {
    const personDocRef = doc(db, PEOPLE_COLLECTION, personId);
    try {
        await updateDoc(personDocRef, {
            status: status,
            updatedAt: serverTimestamp(),
            updatedByUid: editorUid,
        });
    } catch (error) {
        console.error(`Error updating person status for ${personId}:`, error);
        throw error;
    }
}


export async function getAssetById(assetId: string): Promise<Asset | null> {
  try {
    const assetDocRef = doc(db, ASSETS_COLLECTION, assetId);
    const docSnap = await getDoc(assetDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        purchaseDate: data.purchaseDate,
        installationDate: data.installationDate,
        commissionedDate: data.commissionedDate,
        decommissionedDate: data.decommissionedDate,
        warrantyExpiryDate: data.warrantyExpiryDate,
        nextServiceDate: data.nextServiceDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Asset;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching asset with ID ${assetId}:`, error);
    return null;
  }
}

export async function createAsset(data: CreateAssetData, userId: string): Promise<string> {
    const userProfile = await getPersonByUid(userId);
    if (!userProfile?.buildingId) {
        throw new Error("User creating asset has no associated building.");
    }

    try {
        const cleanedData = cleanDataForFirestore(data);
        const firestoreData: any = {
          ...cleanedData,
          buildingId: userProfile.buildingId,
          createdByUid: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (data.purchaseDate && data.purchaseDate instanceof Date) firestoreData.purchaseDate = Timestamp.fromDate(data.purchaseDate);
        if (data.installationDate && data.installationDate instanceof Date) firestoreData.installationDate = Timestamp.fromDate(data.installationDate);
        if (data.commissionedDate && data.commissionedDate instanceof Date) firestoreData.commissionedDate = Timestamp.fromDate(data.commissionedDate);
        if (data.decommissionedDate && data.decommissionedDate instanceof Date) firestoreData.decommissionedDate = Timestamp.fromDate(data.decommissionedDate);
        if (data.warrantyExpiryDate && data.warrantyExpiryDate instanceof Date) firestoreData.warrantyExpiryDate = Timestamp.fromDate(data.warrantyExpiryDate);
        if (data.nextServiceDate && data.nextServiceDate instanceof Date) firestoreData.nextServiceDate = Timestamp.fromDate(data.nextServiceDate);

        firestoreData.flatId = data.flatId === '' ? null : data.flatId;
        firestoreData.flatNumber = data.flatNumber === '' ? null : data.flatNumber;
        firestoreData.supplierId = data.supplierId === '' ? null : data.supplierId;
        firestoreData.supplierName = data.supplierName === '' ? null : data.supplierName;

        const assetDocRef = await addDoc(collection(db, ASSETS_COLLECTION), firestoreData);
        const assetId = assetDocRef.id;

        if (data.nextServiceDate && data.name && data.nextServiceDate instanceof Date) {
          const serviceDateStart = new Date(data.nextServiceDate);
          serviceDateStart.setHours(0, 0, 0, 0);
          const serviceDateEnd = new Date(data.nextServiceDate);
          serviceDateEnd.setHours(23, 59, 59, 999);

          const eventData: CreateScheduledEventData = {
            title: `Service Due: ${data.name}`,
            start: serviceDateStart,
            end: serviceDateEnd,
            allDay: true,
            buildingId: userProfile.buildingId,
            assetId: assetId,
            assetName: data.name,
          };
          await createScheduledEvent(eventData, userId);
        }
        return assetId;
    } catch (error) {
        console.error('Error creating asset and/or service event:', error);
        throw error;
    }
}

export async function updateAsset(
  assetId: string,
  userId: string,
  data: UpdateAssetData
): Promise<void> {
  const assetDocRef = doc(db, ASSETS_COLLECTION, assetId);
  const batch = writeBatch(db);

  try {
    const currentAssetSnap = await getDoc(assetDocRef);
    if (!currentAssetSnap.exists()) throw new Error("Asset not found.");
    const currentAssetData = currentAssetSnap.data() as Asset;

    const cleanedUpdateData = cleanDataForFirestore(data);
    const firestoreUpdateData: any = { ...cleanedUpdateData, updatedAt: serverTimestamp() };

    const dateFields: (keyof UpdateAssetData)[] = ['purchaseDate', 'installationDate', 'commissionedDate', 'decommissionedDate', 'warrantyExpiryDate', 'nextServiceDate'];
    dateFields.forEach(field => {
        const fieldValue = data[field];
        if (fieldValue instanceof Date) {
          firestoreUpdateData[field] = Timestamp.fromDate(fieldValue);
        } else if (fieldValue === null) {
          firestoreUpdateData[field] = null;
        }
    });

    if (data.flatId === null) {
        firestoreUpdateData.flatId = null;
        firestoreUpdateData.flatNumber = null;
    } else if (data.flatId && data.flatId !== currentAssetData.flatId) {
        const flatDoc = await getDoc(doc(db, FLATS_COLLECTION, data.flatId));
        if (flatDoc.exists()) {
            firestoreUpdateData.flatNumber = (flatDoc.data() as Flat).flatNumber;
        } else {
            firestoreUpdateData.flatNumber = null;
        }
    }

    if (data.supplierId === null) {
        firestoreUpdateData.supplierId = null;
        firestoreUpdateData.supplierName = null;
    } else if (data.supplierId && data.supplierId !== currentAssetData.supplierId) {
        const supplierDoc = await getDoc(doc(db, SUPPLIERS_COLLECTION, data.supplierId));
        if (supplierDoc.exists()) {
            firestoreUpdateData.supplierName = (supplierDoc.data() as Supplier).name;
        } else {
            firestoreUpdateData.supplierName = null;
        }
    }

    batch.update(assetDocRef, firestoreUpdateData);

    const oldNextServiceDate = currentAssetData.nextServiceDate ? toDate(currentAssetData.nextServiceDate) : null;
    const newNextServiceDateInput = data.nextServiceDate;
    let newNextServiceDate: Date | null = null;
    if (newNextServiceDateInput instanceof Date) {
        newNextServiceDate = newNextServiceDateInput;
    } else if (newNextServiceDateInput && typeof (newNextServiceDateInput as Timestamp).toDate === 'function') {
        newNextServiceDate = (newNextServiceDateInput as Timestamp).toDate();
    } else if (newNextServiceDateInput === null) {
        newNextServiceDate = null;
    }

    const assetNameChanged = data.name && data.name !== currentAssetData.name;
    const serviceDateActuallyChanged = oldNextServiceDate?.getTime() !== newNextServiceDate?.getTime();
    const serviceEventNeedsUpdate = serviceDateActuallyChanged || (assetNameChanged && newNextServiceDate !== null);

    if (serviceEventNeedsUpdate) {
      const titlePrefix = "Service Due:";
      const eventsQuery = query(
        collection(db, SCHEDULED_EVENTS_COLLECTION),
        where('assetId', '==', assetId),
        where('title', '>=', titlePrefix),
        where('title', '<', titlePrefix + '\uf8ff')
      );
      const oldEventsSnap = await getDocs(eventsQuery);
      oldEventsSnap.forEach(eventDoc => batch.delete(doc(db, SCHEDULED_EVENTS_COLLECTION, eventDoc.id)));

      if (newNextServiceDate) { 
        const serviceDateStart = new Date(newNextServiceDate); serviceDateStart.setHours(0,0,0,0);
        const serviceDateEnd = new Date(newNextServiceDate); serviceDateEnd.setHours(23,59,59,999);
        const eventData: CreateScheduledEventData = {
            title: `Service Due: ${data.name || currentAssetData.name}`,
            start: serviceDateStart, end: serviceDateEnd, allDay: true,
            buildingId: currentAssetData.buildingId,
            assetId: assetId, assetName: data.name || currentAssetData.name,
        };
        const newEventRef = doc(collection(db, SCHEDULED_EVENTS_COLLECTION));
        batch.set(newEventRef, cleanDataForFirestore({ ...eventData, createdByUid: userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
      }
    }
    
    await batch.commit();

  } catch (error) {
    console.error(`Error updating asset ${assetId}:`, error);
    throw error;
  }
}

export async function getAssets(buildingId?: string): Promise<Asset[]> {
  try {
    const queryConstraints = buildingId
      ? [where('buildingId', '==', buildingId), orderBy('name', 'asc')]
      : [orderBy('name', 'asc')];
      
    const q = query(collection(db, ASSETS_COLLECTION), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, ...data,
        purchaseDate: data.purchaseDate,
        installationDate: data.installationDate,
        commissionedDate: data.commissionedDate,
        decommissionedDate: data.decommissionedDate,
        warrantyExpiryDate: data.warrantyExpiryDate,
        nextServiceDate: data.nextServiceDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Asset;
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    const assetDocRef = doc(db, ASSETS_COLLECTION, id);
    await deleteDoc(assetDocRef);
    const eventsQuery = query(collection(db, SCHEDULED_EVENTS_COLLECTION), where('assetId', '==', id));
    const oldEventsSnap = await getDocs(eventsQuery);
    const batch = writeBatch(db);
    oldEventsSnap.forEach(eventDoc => batch.delete(doc(db, SCHEDULED_EVENTS_COLLECTION, eventDoc.id)));
    await batch.commit();
  } catch (error) {
    console.error(`Error deleting asset ${id}:`, error);
    throw error;
  }
}

export async function generateAndStoreServiceChargeDemands(
  input: CreateServiceChargeDemandsInput
): Promise<CreateServiceChargeDemandsOutput> {
  try {
    if (!input.includeGroundRent && (!input.serviceChargeRatePerSqFt || input.serviceChargeRatePerSqFt <= 0)) {
        return { success: false, message: `Service Charge Rate not provided or invalid. Rate must be > 0.`, demandsGenerated: 0 };
    }
    if (input.paymentDueLeadDays === undefined || input.paymentDueLeadDays < 0) {
        return { success: false, message: `Payment due days not provided or invalid. Must be >= 0.`, demandsGenerated: 0 };
    }
    if (input.flatsToProcess.length === 0) {
        return { success: true, message: `No flats selected or provided to generate demands for.`, demandsGenerated: 0 };
    }

    const batch = writeBatch(db);
    let demandsGeneratedCount = 0;
    const paymentDueDate = subDays(input.financialQuarterStartDate, input.paymentDueLeadDays);

    for (const flat of input.flatsToProcess) {
      const serviceChargeAmount = (flat.areaSqFt || 0) * input.serviceChargeRatePerSqFt;
      const groundRentAmount = input.includeGroundRent ? (flat.groundRent || 0) : 0;
      
      const totalAmountDue = serviceChargeAmount + groundRentAmount;
      if (totalAmountDue <= 0) {
          console.warn(`Skipping Flat ${flat.flatNumber} (ID: ${flat.id}): Total demand amount is zero or less.`);
          continue;
      }

      const demandData: Omit<ServiceChargeDemand, 'id'> = {
        flatId: flat.id,
        buildingId: input.buildingId,
        flatNumber: flat.flatNumber,
        financialQuarterDisplayString: input.financialQuarterDisplayString,
        areaSqFt: flat.areaSqFt || 0,
        rateApplied: input.serviceChargeRatePerSqFt,
        baseAmount: serviceChargeAmount,
        groundRentAmount: groundRentAmount > 0 ? groundRentAmount : undefined,
        penaltyAmountApplied: 0,
        totalAmountDue: totalAmountDue,
        amountPaid: 0,
        outstandingAmount: totalAmountDue,
        dueDate: Timestamp.fromDate(paymentDueDate),
        issuedDate: serverTimestamp() as Timestamp,
        status: ServiceChargeDemandStatus.ISSUED,
        issuedByUid: input.managerUid, 
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        paymentHistory: [],
      };

      const demandDocRef = doc(collection(db, SERVICE_CHARGE_DEMANDS_COLLECTION));
      batch.set(demandDocRef, cleanDataForFirestore(demandData));
      demandsGeneratedCount++;
    }

    if (demandsGeneratedCount > 0) {
      await batch.commit();
      const type = input.includeGroundRent ? "consolidated service charge and ground rent" : "service charge";
      return {
        success: true,
        message: `Successfully generated and stored ${demandsGeneratedCount} ${type} demand(s) for ${input.financialQuarterDisplayString}.`,
        demandsGenerated: demandsGeneratedCount,
      };
    } else {
      return {
        success: true,
        message: `No valid flats found among the selected ones to generate demands for.`,
        demandsGenerated: 0,
      };
    }
  } catch (error: any) {
    console.error("Error generating service charge demands:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred while generating demands.",
      demandsGenerated: 0,
    };
  }
}

export async function getServiceChargeDemands(buildingId: string): Promise<ServiceChargeDemand[]> {
  try {
    const demandsRef = collection(db, SERVICE_CHARGE_DEMANDS_COLLECTION);
    const q = query(demandsRef, where('buildingId', '==', buildingId), orderBy('issuedDate', 'desc'), orderBy('flatNumber', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id, ...data,
        dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : new Date(),
        issuedDate: data.issuedDate ? (data.issuedDate as Timestamp).toDate() : new Date(),
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
      } as ServiceChargeDemand;
    });
  } catch (error) {
    console.error('Error fetching service charge demands:', error);
    return [];
  }
}

export async function recordPaymentForDemand(
  demandId: string,
  paymentInput: RecordPaymentInput,
  managerUid: string 
): Promise<void> {
  const demandRef = doc(db, SERVICE_CHARGE_DEMANDS_COLLECTION, demandId);
  try {
    await runTransaction(db, async (transaction) => {
      const demandDoc = await transaction.get(demandRef);
      if (!demandDoc.exists()) throw new Error("Service charge demand not found.");
      const demandData = demandDoc.data() as ServiceChargeDemand;

      const newPaymentId = doc(collection(db, "dummy")).id;

      const newPaymentRecord: Partial<PaymentRecord> = {
        paymentId: newPaymentId,
        amount: paymentInput.amount,
        paymentDate: Timestamp.fromDate(paymentInput.paymentDate),
        method: paymentInput.method || PaymentMethod.OTHER,
        recordedByUid: managerUid,
        recordedAt: Timestamp.now(),
      };
      if (paymentInput.reference) newPaymentRecord.reference = paymentInput.reference;
      if (paymentInput.notes) newPaymentRecord.notes = paymentInput.notes;

      const updatedPaymentHistory = [...(demandData.paymentHistory || []), newPaymentRecord as PaymentRecord];
      const newAmountPaid = (demandData.amountPaid || 0) + paymentInput.amount;
      const newOutstandingAmount = demandData.totalAmountDue - newAmountPaid;
      let newStatus = demandData.status;

      if (newOutstandingAmount <= 0) {
        newStatus = ServiceChargeDemandStatus.PAID;
      } else if (newAmountPaid > 0 && newOutstandingAmount < demandData.totalAmountDue) {
        newStatus = ServiceChargeDemandStatus.PARTIALLY_PAID;
      }

      transaction.update(demandRef, {
        amountPaid: newAmountPaid,
        outstandingAmount: newOutstandingAmount,
        paymentHistory: updatedPaymentHistory,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error(`Error recording payment for demand ${demandId}:`, error);
    throw error;
  }
}

export async function applyPenaltyToDemand(
  demandId: string,
  managerUid: string,
  penaltyAmount: number
): Promise<void> {
  const demandRef = doc(db, SERVICE_CHARGE_DEMANDS_COLLECTION, demandId);
  const batch = writeBatch(db);

  try {
    if (penaltyAmount <= 0) {
      throw new Error("Penalty amount must be greater than zero.");
    }
    const demandDoc = await getDoc(demandRef);
    if (!demandDoc.exists()) throw new Error("Service charge demand not found.");

    const demandData = demandDoc.data() as ServiceChargeDemand;

    if (demandData.status === ServiceChargeDemandStatus.PAID) {
      throw new Error("Cannot apply penalty to a fully paid demand.");
    }
    if (demandData.penaltyAppliedAt) {
      throw new Error("A penalty has already been applied to this demand.");
    }

    const newTotalAmountDue = demandData.totalAmountDue + penaltyAmount;
    const newOutstandingAmount = demandData.outstandingAmount + penaltyAmount;
    const newPenaltyAmountApplied = (demandData.penaltyAmountApplied || 0) + penaltyAmount;

    batch.update(demandRef, {
      totalAmountDue: newTotalAmountDue,
      outstandingAmount: newOutstandingAmount,
      penaltyAmountApplied: newPenaltyAmountApplied,
      penaltyAppliedAt: serverTimestamp(),
      status: ServiceChargeDemandStatus.OVERDUE,
      updatedAt: serverTimestamp(),
      updatedByUid: managerUid,
    });

    const peopleQuery = query(collection(db, PEOPLE_COLLECTION), where('flatId', '==', demandData.flatId), where('isPrimaryContact', '==', true), limit(1));
    const peopleSnapshot = await getDocs(peopleQuery);

    if (!peopleSnapshot.empty) {
        const personDoc = peopleSnapshot.docs[0];
        const personData = personDoc.data() as Person;
        if (personData.uid) { 
            await createReminder({
                userId: personData.uid,
                buildingId: demandData.buildingId,
                title: `Late Payment Penalty Applied`,
                description: `A penalty of ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(penaltyAmount)} has been applied to your service charge for ${demandData.financialQuarterDisplayString}.`,
                link: `/finances`,
                type: ReminderType.LATE_PAYMENT_PENALTY,
                severity: ReminderSeverity.DESTRUCTIVE,
                relatedDocId: demandId,
                relatedCollection: SERVICE_CHARGE_DEMANDS_COLLECTION,
            }, batch);
        }
    }

    await batch.commit();
  } catch (error) {
    console.error(`Error applying penalty to demand ${demandId}:`, error);
    throw error;
  }
}

export async function createExpense(buildingId: string, data: CreateExpenseData, userId: string): Promise<string> {
  try {
    const cleanedData = cleanDataForFirestore(data);
    const expensePayload: any = {
      ...cleanedData,
      buildingId,
      date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      createdByUid: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if(data.workOrderId) expensePayload.workOrderId = data.workOrderId;

    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expensePayload);
    return docRef.id;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
}

export async function getExpenses(buildingId: string): Promise<Expense[]> {
  try {
    const expensesRef = collection(db, EXPENSES_COLLECTION);
    const q = query(expensesRef, where('buildingId', '==', buildingId), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id, ...data,
        date: (data.date as Timestamp).toDate(),
      } as Expense;
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
}

export async function getBudgetCategories(buildingId: string, financialYear?: string): Promise<BudgetCategory[]> {
    try {
        const qConstraints = [
            where('buildingId', '==', buildingId),
            where('isArchived', '!=', true),
            orderBy('name', 'asc'),
        ];
        if (financialYear) {
            qConstraints.unshift(where('financialYear', '==', financialYear));
        }

        const q = query(collection(db, BUDGET_CATEGORIES_COLLECTION), ...qConstraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetCategory));
    } catch (error) {
        console.error('Error fetching budget categories:', error);
        return [];
    }
}


export async function createBudgetCategory(buildingId: string, data: CreateBudgetCategoryData): Promise<string> {
    try {
        const cleanedData = cleanDataForFirestore(data);
        const docRef = await addDoc(collection(db, BUDGET_CATEGORIES_COLLECTION), {
            ...cleanedData,
            buildingId: buildingId,
            isArchived: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating budget category:', error);
        throw error;
    }
}

export async function updateBudgetCategory(id: string, buildingId: string, data: Partial<CreateBudgetCategoryData>): Promise<void> {
  try {
    const docRef = doc(db, BUDGET_CATEGORIES_COLLECTION, id);
    const cleanedData = cleanDataForFirestore(data);
    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating budget category ${id}:`, error);
    throw error;
  }
}

export async function deleteBudgetCategory(buildingId: string, categoryId: string): Promise<void> {
    const categoryDocRef = doc(db, BUDGET_CATEGORIES_COLLECTION, categoryId);
    try {
        const expensesQuery = query(collection(db, EXPENSES_COLLECTION), where('buildingId', '==', buildingId), where('categoryId', '==', categoryId), limit(1));
        const expensesSnapshot = await getDocs(expensesQuery);
        if (!expensesSnapshot.empty) {
            throw new Error("Cannot archive category with associated expenses.");
        }
        await updateDoc(categoryDocRef, { isArchived: true, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error(`Error archiving budget category ${categoryId}:`, error);
        throw error;
    }
}


export async function updateBudgetCategoryForecasts(
  buildingId: string,
  forecastsToUpdate: { id: string; forecastPercentage: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  forecastsToUpdate.forEach(item => {
    const docRef = doc(db, BUDGET_CATEGORIES_COLLECTION, item.id);
    batch.update(docRef, { 
      forecastPercentage: item.forecastPercentage,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}


export async function saveGlobalFinancialSettings(buildingId: string, settings: GlobalFinancialSettings, userId: string): Promise<void> {
  const settingsDocRef = doc(db, APPLICATION_CONFIGURATION_COLLECTION, buildingId);
  try {
    const firestoreSettings: Partial<FirestoreGlobalFinancialSettings> = {
      serviceChargeRatePerSqFt: settings.serviceChargeRatePerSqFt,
      paymentDueLeadDays: settings.paymentDueLeadDays,
      financialYearStartDate: settings.financialYearStartDate ? Timestamp.fromDate(settings.financialYearStartDate) : null,
      reserveFundContributionPercentage: settings.reserveFundContributionPercentage,
      isBudgetLocked: settings.isBudgetLocked,
      reminderPrioritySettings: settings.reminderPrioritySettings,
      updatedAt: serverTimestamp(),
      updatedByUid: userId,
    };
    await setDoc(settingsDocRef, { globalFinancialSettings: cleanDataForFirestore(firestoreSettings) }, { merge: true });
  } catch (error) {
    console.error('Error saving global financial settings:', error);
    throw error;
  }
}

export async function getGlobalFinancialSettings(buildingId: string): Promise<GlobalFinancialSettings> {
  const settingsDocRef = doc(db, APPLICATION_CONFIGURATION_COLLECTION, buildingId);
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data().globalFinancialSettings as FirestoreGlobalFinancialSettings;
      if (data) {
        return {
          serviceChargeRatePerSqFt: data.serviceChargeRatePerSqFt ?? null,
          paymentDueLeadDays: data.paymentDueLeadDays ?? null,
          financialYearStartDate: data.financialYearStartDate ? data.financialYearStartDate.toDate() : null,
          reserveFundContributionPercentage: data.reserveFundContributionPercentage ?? null,
          isBudgetLocked: data.isBudgetLocked ?? false,
          reminderPrioritySettings: data.reminderPrioritySettings ?? {},
        };
      }
    }
    return {
        serviceChargeRatePerSqFt: null,
        paymentDueLeadDays: null,
        financialYearStartDate: new Date(new Date().getFullYear(), 3, 1),
        reserveFundContributionPercentage: null,
        isBudgetLocked: false,
        reminderPrioritySettings: {},
    };
  } catch (error) {
    console.error('Error fetching global financial settings:', error);
    return {
        serviceChargeRatePerSqFt: null,
        paymentDueLeadDays: null,
        financialYearStartDate: new Date(new Date().getFullYear(), 3, 1),
        reserveFundContributionPercentage: null,
        isBudgetLocked: false,
        reminderPrioritySettings: {},
    };
  }
}

export const DEFAULT_REMINDER_PRIORITIES: { [key in ReminderType]: ReminderPriority } = {
  [ReminderType.LATE_PAYMENT_PENALTY]: ReminderPriority.HIGH,
  [ReminderType.USER_FEEDBACK_REQUESTED]: ReminderPriority.NORMAL,
};

export async function createReminder(
  data: Omit<Reminder, 'id' | 'createdAt' | 'isDismissed' | 'priority'>,
  batch?: ReturnType<typeof writeBatch>
): Promise<void> {
  const settings = await getGlobalFinancialSettings(data.buildingId);
  const priority = settings.reminderPrioritySettings?.[data.type] || DEFAULT_REMINDER_PRIORITIES[data.type];

  const reminderData: Omit<Reminder, 'id'> = {
    ...data,
    priority: priority,
    createdAt: serverTimestamp() as Timestamp,
    isDismissed: false,
  };
  if (batch) {
    const reminderRef = doc(collection(db, REMINDERS_COLLECTION));
    batch.set(reminderRef, reminderData);
  } else {
    await addDoc(collection(db, REMINDERS_COLLECTION), reminderData);
  }
}

export async function getRemindersForUser(userId: string): Promise<Reminder[]> {
  try {
    const remindersRef = collection(db, REMINDERS_COLLECTION);
    const q = query(
      remindersRef,
      where('userId', '==', userId),
      where('isDismissed', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as Reminder));
  } catch (error) {
    console.error(`Error fetching reminders for user ${userId}:`, error);
    return [];
  }
}

export async function dismissReminder(reminderId: string, userId: string): Promise<void> {
  const reminderRef = doc(db, REMINDERS_COLLECTION, reminderId);
  try {
    await updateDoc(reminderRef, {
      isDismissed: true,
      dismissedAt: serverTimestamp(),
      dismissedByUid: userId,
    });
  } catch (error) {
    console.error(`Error dismissing reminder ${reminderId}:`, error);
    throw new Error('Failed to dismiss reminder.');
  }
}

export async function dismissRemindersForWorkOrder(workOrderId: string, batch?: ReturnType<typeof writeBatch>): Promise<void> {
    const remindersQuery = query(
        collection(db, REMINDERS_COLLECTION),
        where('relatedDocId', '==', workOrderId),
        where('relatedCollection', '==', WORK_ORDERS_COLLECTION),
        where('isDismissed', '==', false)
    );
    
    const querySnapshot = await getDocs(remindersQuery);
    if (querySnapshot.empty) {
        return;
    }

    if (batch) {
        querySnapshot.forEach(docSnap => {
            batch.update(docSnap.ref, { isDismissed: true, dismissedAt: serverTimestamp() });
        });
    } else {
        const localBatch = writeBatch(db);
        querySnapshot.forEach(docSnap => {
            localBatch.update(docSnap.ref, { isDismissed: true, dismissedAt: serverTimestamp() });
        });
        await localBatch.commit();
    }
}

export async function getBuildingById(buildingId: string): Promise<Building | null> {
  const buildingDocRef = doc(db, BUILDINGS_COLLECTION, buildingId);
  try {
    const docSnap = await getDoc(buildingDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Building;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching building with ID ${buildingId}:`, error);
    return null;
  }
}

export async function getBuildings(): Promise<Building[]> {
  try {
    const q = query(collection(db, BUILDINGS_COLLECTION), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
}

export async function getBuildingsCount(): Promise<number> {
  try {
    const buildingsRef = collection(db, BUILDINGS_COLLECTION);
    const snapshot = await getCountFromServer(buildingsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error fetching buildings count:', error);
    return 0; // Return 0 on error to avoid breaking signup flow
  }
}

export async function createBuilding(buildingId: string, data: CreateBuildingData, creatorUid: string): Promise<void> {
  const buildingDocRef = doc(db, BUILDINGS_COLLECTION, buildingId);
  try {
    const buildingData = {
      ...data,
      createdAt: serverTimestamp(),
      createdByUid: creatorUid,
    };
    await setDoc(buildingDocRef, buildingData);
  } catch (error) {
    console.error(`Error creating building with ID ${buildingId}:`, error);
    throw error;
  }
}

export async function updateBuilding(buildingId: string, data: Partial<CreateBuildingData>): Promise<void> {
  const buildingDocRef = doc(db, BUILDINGS_COLLECTION, buildingId);
  try {
    await updateDoc(buildingDocRef, cleanDataForFirestore(data));
  } catch (error) {
    console.error(`Error updating building with ID ${buildingId}:`, error);
    throw error;
  }
}
