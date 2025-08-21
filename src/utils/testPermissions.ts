import { UserBuildingService } from '../services/userBuildingService';
import { TicketCommentService } from '../services/ticketCommentService';
import { User } from '../types';

// Test users to simulate different permission scenarios
const testUsers: User[] = [
  // Manager user
  {
    id: 'test-manager-1',
    email: 'manager@building.com',
    name: 'John Manager',
    role: 'manager',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Resident user
  {
    id: 'test-resident-1',
    email: 'resident@building.com',
    name: 'Jane Resident',
    role: 'resident',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Another resident user
  {
    id: 'test-resident-2',
    email: 'james.wilson@email.com',
    name: 'James Wilson',
    role: 'resident',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export async function testPermissionSystem() {
  console.log('\n🧪 TESTING PERMISSION SYSTEM\n');
  console.log('='.repeat(50));

  // Load mock tickets for testing (optional, falls back to test data if unavailable)
  let testTickets = [];
  try {
    const { mockTickets } = await import('../services/mockData');
    testTickets = mockTickets.slice(0, 3);
    console.log('✅ Using mock tickets from mockData');
  } catch (error) {
    console.warn('⚠️ Mock data not available, using fallback test tickets');
    // Fallback test tickets for permission testing
    testTickets = [
      {
        id: 'test-ticket-1',
        title: 'Test Ticket 1',
        buildingId: 'building-1',
        requestedBy: 'test-resident-1'
      },
      {
        id: 'test-ticket-2',
        title: 'Test Ticket 2',
        buildingId: 'building-2',
        requestedBy: 'test-resident-2'
      },
      {
        id: 'test-ticket-3',
        title: 'Test Ticket 3',
        buildingId: 'building-1',
        requestedBy: 'test-manager-1'
      }
    ];
  }

  // Test each user against each ticket
  testUsers.forEach(user => {
    console.log(`\n👤 Testing user: ${user.name} (${user.role}) - ${user.email}`);
    
    // Get user's building associations
    const userBuildingIds = UserBuildingService.getUserBuildingIds(user);
    const userResidentId = UserBuildingService.getUserResidentId(user);
    
    console.log(`📍 User buildings: ${userBuildingIds.join(', ')}`);
    console.log(`🏠 Resident ID: ${userResidentId || 'N/A'}`);
    
    // Test against test tickets
    testTickets.forEach(ticket => {
      console.log(`\n  🎫 Ticket: ${ticket.title} (ID: ${ticket.id})`);
      console.log(`     Building: ${ticket.buildingId}, Requested by: ${ticket.requestedBy}`);
      
      const canComment = TicketCommentService.canUserComment(
        ticket.id,
        userResidentId || user.id,
        user.role as 'resident' | 'manager',
        userBuildingIds
      );
      
      console.log(`     ✅ Can comment: ${canComment ? 'YES' : 'NO'}`);
    });
    
    console.log('\n' + '-'.repeat(40));
  });

  console.log('\n📊 SUMMARY OF EXPECTED BEHAVIOR:');
  console.log('• Managers should be able to comment on tickets in their buildings');
  console.log('• Residents should only be able to comment on their own tickets');
  console.log('• The system uses building IDs and resident IDs for permission checks');
  
  console.log('\n🔍 To test this in the UI:');
  console.log('1. Run npm run dev in another terminal');
  console.log('2. Open http://localhost:3005');
  console.log('3. Login with different users (manager@building.com, etc.)');
  console.log('4. Go to Tickets page and click on a ticket to see comment permissions');
  console.log('5. Check browser console for detailed permission logs');
}

// Export function to be called from browser console
(window as any).testPermissions = testPermissionSystem;
