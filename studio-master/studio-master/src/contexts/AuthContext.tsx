
// This file is deprecated and has been replaced by AuthContext.tsx in `src/app/(app)/auth-provider.tsx`.
// It can be safely deleted.
// For now, it is kept to prevent breaking any remaining imports during transition.

"use client";

import * as React from 'react';
import { type UserProfile } from '@/types';
import type { Building } from '@/types';

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
