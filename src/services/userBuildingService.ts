import { User } from '../types';

export class UserBuildingService {
  /**
   * Get building IDs that a user has access to based on their role and profile
   */
  static getUserBuildingIds(currentUser: User): string[] {
    if (!currentUser) return [];

    // For managers, we need to determine which buildings they manage
    if (currentUser.role === 'manager') {
      // For development, we'll map demo managers to specific buildings
      // In production, this would come from a proper user-building association table
      
      const managerBuildingMap: Record<string, string[]> = {
        // Demo users from authService - include both mock and Firebase building IDs
        'manager@building.com': [
          'building-1', 
          'building-2', 
          'building-3',
          'YTjZabdRO0wQDXVgcp5b' // Firebase building ID from the logs
        ],
        'john.manager@email.com': ['building-1', 'YTjZabdRO0wQDXVgcp5b'],
        'victoria.manager@email.com': ['building-2'], 
        'canary.manager@email.com': ['building-3'],
      };

      // First try to match by email
      const buildingsByEmail = managerBuildingMap[currentUser.email];
      if (buildingsByEmail) {
        console.log(`🏢 Manager building access for ${currentUser.email}:`, buildingsByEmail);
        return buildingsByEmail;
      }

      // Fallback: match by name patterns for development
      if (currentUser.name?.toLowerCase().includes('manager')) {
        if (currentUser.name?.toLowerCase().includes('john')) {
          const buildings = ['building-1', 'YTjZabdRO0wQDXVgcp5b'];
          console.log(`🏢 Manager building access by name pattern:`, buildings);
          return buildings;
        }
        if (currentUser.name?.toLowerCase().includes('victoria')) return ['building-2'];
        if (currentUser.name?.toLowerCase().includes('canary')) return ['building-3'];
      }

      // For development: Give managers universal access to all building types
      // This ensures permission system works with both mock and Firebase building IDs
      console.log(`🏢 DEVELOPMENT MODE: Manager has universal building access`);
      return ['*']; // Special wildcard to indicate access to any building
    }

    // For residents/requesters - simplified logic without mock data dependencies
    if (currentUser.role === 'resident' || currentUser.role === 'requester') {
      // Map known demo users to specific buildings
      const residentBuildingMap: Record<string, string[]> = {
        'requester@building.com': ['building-1'],
        'james.wilson@email.com': ['building-1'], 
        'jane.resident@email.com': ['building-2'],
      };
      
      const buildingsByEmail = residentBuildingMap[currentUser.email];
      if (buildingsByEmail) {
        console.log(`🏠 Resident building access for ${currentUser.email}:`, buildingsByEmail);
        return buildingsByEmail;
      }
      
      // For development: Give residents access to building-1 by default
      console.log(`🏠 DEFAULT: Resident assigned to building-1`);
      return ['building-1'];
    }

    return [];
  }

  /**
   * Check if a user has access to a specific building
   */
  static userHasBuildingAccess(currentUser: User, buildingId: string): boolean {
    const userBuildingIds = this.getUserBuildingIds(currentUser);
    return userBuildingIds.includes(buildingId);
  }

  /**
   * Get the resident ID for a user (needed for checking if they can comment on their own tickets)
   * Simplified to use Firebase user ID directly since tickets use Firebase user IDs
   */
  static getUserResidentId(currentUser: User): string | null {
    if (!currentUser) return null;

    // For Firebase-based system, use the Firebase user ID directly
    // This should match the requestedBy field in Firebase tickets
    console.log(`👤 Using Firebase user ID as resident ID: ${currentUser.id}`);
    return currentUser.id;
  }
}
