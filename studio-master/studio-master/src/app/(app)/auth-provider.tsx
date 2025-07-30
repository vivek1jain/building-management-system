
"use client";

import * as React from 'react';
import type { UserProfile, Building } from '@/types';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';
import { getPeople, getBuildings, getPersonByUid } from '@/lib/firebase/firestore'; 
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  allPeople: UserProfile[];
  buildings: Building[];
  activeBuildingId: string | null;
  setActiveBuilding: (buildingId: string) => void;
  setActiveUser: (userId: string) => void;
  refreshAuthContextUser: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [allPeople, setAllPeople] = React.useState<UserProfile[]>([]);
  const [allBuildings, setAllBuildings] = React.useState<Building[]>([]);
  const [accessibleBuildings, setAccessibleBuildings] = React.useState<Building[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeBuildingId, setActiveBuildingId] = React.useState<string | null>(null);

  const initializeData = React.useCallback(async (initialUser: UserProfile | null) => {
    setLoading(true);
    try {
      const [fetchedPeople, fetchedBuildings] = await Promise.all([
        getPeople(),
        getBuildings()
      ]);

      const userProfiles = fetchedPeople.map(p => ({ ...p, displayName: p.name }));
      setAllPeople(userProfiles);
      setAllBuildings(fetchedBuildings);
      
      let activeUser: UserProfile | null = initialUser;

      if (!activeUser && userProfiles.length > 0) {
        const lastActiveUserId = typeof window !== 'undefined' ? localStorage.getItem('lastActiveUserId') : null;
        if (lastActiveUserId) {
          activeUser = userProfiles.find(p => p.id === lastActiveUserId) || null;
        }
        if (!activeUser) {
          activeUser = userProfiles[0]; 
        }
      }
      
      setUser(activeUser);

    } catch (error) {
      console.error("Failed to initialize auth context:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAuthContextUser = React.useCallback(async () => {
    await initializeData(user);
  }, [initializeData, user]);


  React.useEffect(() => {
    // This effect runs only once on mount to set up the initial state.
    // In a real app with login, you might use onAuthStateChanged here.
    // For this mock setup, we'll just initialize with the first user.
    initializeData(null);
  }, [initializeData]);

  React.useEffect(() => {
    if (!user || allBuildings.length === 0) {
      setAccessibleBuildings([]);
      setActiveBuildingId(null);
      return;
    }

    let buildingsToShow: Building[] = [];
    let newActiveBuildingId: string | null = null;
    const storedBuildingId = typeof window !== 'undefined' ? localStorage.getItem('activeBuildingId') : null;

    if (user.role === UserRole.MANAGER) {
      if (user.accessibleBuildingIds && user.accessibleBuildingIds.length > 0) {
        buildingsToShow = allBuildings.filter(b => user.accessibleBuildingIds!.includes(b.id));
      } else {
        buildingsToShow = allBuildings; // Manager with no specific buildings can see all
      }
      
      if (storedBuildingId && buildingsToShow.some(b => b.id === storedBuildingId)) {
          newActiveBuildingId = storedBuildingId;
      } else if (buildingsToShow.length > 0) {
          newActiveBuildingId = buildingsToShow[0].id;
      }
    } else { // Resident or other roles
      buildingsToShow = allBuildings; // Let switcher show all, but logic locks them in
      if (user.buildingId) {
          newActiveBuildingId = user.buildingId;
      }
    }

    setAccessibleBuildings(buildingsToShow);
    setActiveBuildingId(newActiveBuildingId);
    if (newActiveBuildingId && typeof window !== 'undefined') {
      localStorage.setItem('activeBuildingId', newActiveBuildingId);
    }
  }, [user, allBuildings]);


  const setActiveUserAndPersist = (userId: string) => {
    const selectedUser = allPeople.find(p => p.id === userId);
    if (selectedUser) {
        setUser(selectedUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem('lastActiveUserId', selectedUser.id);
            // When user switches, clear the stored building to avoid inconsistent state
            localStorage.removeItem('activeBuildingId');
        }
    }
  };

  const setActiveBuildingAndPersist = (buildingId: string) => {
    setActiveBuildingId(buildingId);
     if (typeof window !== 'undefined') {
        localStorage.setItem('activeBuildingId', buildingId);
    }
  };

  if (loading) {
     return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     );
  }

  const contextValue = {
    user,
    loading,
    allPeople,
    buildings: user?.role === UserRole.MANAGER ? accessibleBuildings : allBuildings,
    activeBuildingId,
    setActiveUser: setActiveUserAndPersist,
    setActiveBuilding: setActiveBuildingAndPersist,
    refreshAuthContextUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
