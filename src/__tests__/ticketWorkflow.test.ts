import { ticketService } from '../services/ticketService';
import { Ticket, TicketStatus, ActivityLogEntry } from '../types';

// Mock Firebase functions
jest.mock('../firebase/config', () => ({
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn()
}));

describe('Ticket Workflow - Complete to Closed Transition', () => {
  const mockUserId = 'test-user-123';
  const mockTicketId = 'test-ticket-456';

  // Helper function to create a mock ticket with activity log
  const createMockTicket = (
    status: TicketStatus,
    activityLog: ActivityLogEntry[] = []
  ): Ticket => ({
    id: mockTicketId,
    title: 'Test Ticket',
    description: 'Test Description',
    location: 'Test Location',
    urgency: 'Medium',
    status,
    requestedBy: 'user-123',
    buildingId: 'building-123',
    attachments: [],
    activityLog,
    quotes: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });

  // Helper function to create activity log entry
  const createActivityLogEntry = (
    action: string,
    description: string,
    daysAgo: number = 0
  ): ActivityLogEntry => ({
    id: Date.now().toString(),
    action,
    description,
    performedBy: mockUserId,
    timestamp: new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)),
    metadata: {}
  });

  describe('canTicketBeReopened', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return false for tickets that are not in Complete status', async () => {
      const mockTicket = createMockTicket('Closed');
      
      // Mock getTicketById to return the ticket
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result).toEqual({
        canReopen: false,
        daysRemaining: 0,
        reason: 'Ticket is not in Complete status'
      });
    });

    it('should return false when no completion activity is found', async () => {
      const mockTicket = createMockTicket('Complete', [
        createActivityLogEntry('Ticket Created', 'Ticket created by user', 10)
      ]);
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result).toEqual({
        canReopen: false,
        daysRemaining: 0,
        reason: 'No completion activity found'
      });
    });

    it('should return true when ticket was completed within 7 days', async () => {
      const completionActivity = createActivityLogEntry(
        'Status Updated',
        'Status changed from Scheduled to Complete',
        3 // 3 days ago
      );
      
      const mockTicket = createMockTicket('Complete', [completionActivity]);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result).toEqual({
        canReopen: true,
        daysRemaining: 4, // 7 - 3 = 4 days remaining
        reason: undefined
      });
    });

    it('should return false when ticket was completed more than 7 days ago', async () => {
      const completionActivity = createActivityLogEntry(
        'Work Completed',
        'Work marked as completed',
        10 // 10 days ago
      );
      
      const mockTicket = createMockTicket('Complete', [completionActivity]);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result).toEqual({
        canReopen: false,
        daysRemaining: 0,
        reason: '7-day reopening window has expired'
      });
    });

    it('should return false when ticket is not found', async () => {
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(null);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result).toEqual({
        canReopen: false,
        daysRemaining: 0,
        reason: 'Ticket not found'
      });
    });

    it('should handle different completion activity formats', async () => {
      const testCases = [
        {
          description: 'Status Updated with Complete',
          activity: createActivityLogEntry('Status Updated', 'Status changed from Scheduled to Complete', 2)
        },
        {
          description: 'Action containing completed',
          activity: createActivityLogEntry('Work Completed', 'Work has been completed by technician', 5)
        },
        {
          description: 'Lowercase completed in action',
          activity: createActivityLogEntry('task completed', 'Task completed successfully', 1)
        }
      ];

      for (const testCase of testCases) {
        const mockTicket = createMockTicket('Complete', [testCase.activity]);
        jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

        const result = await ticketService.canTicketBeReopened(mockTicketId);

        expect(result.canReopen).toBe(true);
        expect(result.daysRemaining).toBeGreaterThan(0);
      }
    });
  });

  describe('reopenTicket', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully reopen a ticket within the grace period', async () => {
      const completionActivity = createActivityLogEntry(
        'Status Updated',
        'Status changed from Scheduled to Complete',
        3
      );
      
      const mockTicket = createMockTicket('Complete', [completionActivity]);
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);
      jest.spyOn(ticketService, 'canTicketBeReopened').mockResolvedValue({
        canReopen: true,
        daysRemaining: 4
      });
      
      // Mock updateDoc
      const updateDoc = require('firebase/firestore').updateDoc;
      updateDoc.mockResolvedValue(undefined);

      await ticketService.reopenTicket(mockTicketId, mockUserId, 'Accidental closure');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'Scheduled',
          activityLog: expect.arrayContaining([
            expect.objectContaining({
              action: 'Ticket Reopened',
              description: 'Ticket reopened from Complete status: Accidental closure',
              performedBy: mockUserId,
              metadata: expect.objectContaining({
                previousStatus: 'Complete',
                newStatus: 'Scheduled',
                reopenReason: 'Accidental closure',
                daysRemainingWhenReopened: 4
              })
            })
          ])
        })
      );
    });

    it('should fail to reopen a ticket outside the grace period', async () => {
      jest.spyOn(ticketService, 'canTicketBeReopened').mockResolvedValue({
        canReopen: false,
        daysRemaining: 0,
        reason: '7-day reopening window has expired'
      });

      await expect(ticketService.reopenTicket(mockTicketId, mockUserId))
        .rejects
        .toThrow('Cannot reopen ticket: 7-day reopening window has expired');
    });

    it('should fail to reopen a non-existent ticket', async () => {
      jest.spyOn(ticketService, 'canTicketBeReopened').mockResolvedValue({
        canReopen: false,
        daysRemaining: 0,
        reason: 'Ticket not found'
      });

      await expect(ticketService.reopenTicket(mockTicketId, mockUserId))
        .rejects
        .toThrow('Cannot reopen ticket: Ticket not found');
    });
  });

  describe('completeTicket', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully complete a ticket with grace period tracking', async () => {
      const mockTicket = createMockTicket('Scheduled');
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);
      
      const updateDoc = require('firebase/firestore').updateDoc;
      updateDoc.mockResolvedValue(undefined);

      await ticketService.completeTicket(mockTicketId, mockUserId, 100, 'All work finished');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'Complete',
          completedDate: expect.any(Function), // serverTimestamp
          activityLog: expect.arrayContaining([
            expect.objectContaining({
              action: 'Work Completed',
              description: 'Work marked as completed: All work finished',
              performedBy: mockUserId,
              metadata: expect.objectContaining({
                previousStatus: 'Scheduled',
                completionNotes: 'All work finished',
                gracePeriodExpires: expect.any(String)
              })
            })
          ])
        })
      );
    });

    it('should complete a ticket without notes', async () => {
      const mockTicket = createMockTicket('Scheduled');
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);
      
      const updateDoc = require('firebase/firestore').updateDoc;
      updateDoc.mockResolvedValue(undefined);

      await ticketService.completeTicket(mockTicketId, mockUserId, 50, 'Maintenance');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'Complete',
          activityLog: expect.arrayContaining([
            expect.objectContaining({
              description: 'Work marked as completed',
              metadata: expect.objectContaining({
                completionNotes: undefined
              })
            })
          ])
        })
      );
    });

    it('should fail to complete a non-existent ticket', async () => {
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(null);

      await expect(ticketService.completeTicket(mockTicketId, mockUserId, 75, 'Maintenance'))
        .rejects
        .toThrow('Failed to complete ticket');
    });
  });

  describe('getTicketsEligibleForAutoClosure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return tickets completed more than 7 days ago', async () => {
      // Create mock tickets with different completion dates
      const recentTicket = createMockTicket('Complete', [
        createActivityLogEntry('Work Completed', 'Work finished', 3) // 3 days ago - should NOT be eligible
      ]);

      const oldTicket = createMockTicket('Complete', [
        createActivityLogEntry('Work Completed', 'Work finished', 10) // 10 days ago - should be eligible
      ]);

      const veryOldTicket = createMockTicket('Complete', [
        createActivityLogEntry('Work Completed', 'Work finished', 30) // 30 days ago - should be eligible
      ]);

      // Mock the Firestore query
      const getDocs = require('firebase/firestore').getDocs;
      getDocs.mockResolvedValue({
        docs: [
          { id: 'ticket-1', data: () => recentTicket },
          { id: 'ticket-2', data: () => oldTicket },
          { id: 'ticket-3', data: () => veryOldTicket }
        ]
      });

      const eligibleTickets = await ticketService.getTicketsEligibleForAutoClosure();

      expect(eligibleTickets).toHaveLength(2); // Only oldTicket and veryOldTicket
      expect(eligibleTickets.map(t => t.id)).toContain('ticket-2');
      expect(eligibleTickets.map(t => t.id)).toContain('ticket-3');
      expect(eligibleTickets.map(t => t.id)).not.toContain('ticket-1');
    });

    it('should handle tickets without completion activities', async () => {
      const ticketWithoutCompletion = createMockTicket('Complete', [
        createActivityLogEntry('Ticket Created', 'Created', 15)
      ]);

      const getDocs = require('firebase/firestore').getDocs;
      getDocs.mockResolvedValue({
        docs: [
          { id: 'ticket-1', data: () => ticketWithoutCompletion }
        ]
      });

      const eligibleTickets = await ticketService.getTicketsEligibleForAutoClosure();

      expect(eligibleTickets).toHaveLength(0);
    });

    it('should handle empty result set', async () => {
      const getDocs = require('firebase/firestore').getDocs;
      getDocs.mockResolvedValue({ docs: [] });

      const eligibleTickets = await ticketService.getTicketsEligibleForAutoClosure();

      expect(eligibleTickets).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tickets with multiple completion activities', async () => {
      const activities = [
        createActivityLogEntry('Work Completed', 'First completion', 10),
        createActivityLogEntry('Status Updated', 'Status changed to Complete', 5),
        createActivityLogEntry('Work Completed', 'Final completion', 2)
      ];
      
      const mockTicket = createMockTicket('Complete', activities);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      // Should use the first matching completion activity
      expect(result.canReopen).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.reason).toBe('7-day reopening window has expired');
    });

    it('should handle tickets completed exactly 7 days ago', async () => {
      const completionActivity = createActivityLogEntry(
        'Work Completed',
        'Work finished exactly 7 days ago',
        7 // exactly 7 days ago
      );
      
      const mockTicket = createMockTicket('Complete', [completionActivity]);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result.canReopen).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should handle tickets completed just over 7 days ago', async () => {
      // Create a ticket completed 7.1 days ago (7 days + 2.4 hours)
      const completionTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000) - (2.4 * 60 * 60 * 1000));
      const completionActivity: ActivityLogEntry = {
        id: 'activity-1',
        action: 'Work Completed',
        description: 'Work finished just over 7 days ago',
        performedBy: mockUserId,
        timestamp: completionTime,
        metadata: {}
      };
      
      const mockTicket = createMockTicket('Complete', [completionActivity]);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result.canReopen).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.reason).toBe('7-day reopening window has expired');
    });

    it('should handle malformed activity log entries gracefully', async () => {
      // Create activity with missing or malformed timestamp
      const malformedActivity = {
        id: 'bad-activity',
        action: 'Work Completed',
        description: 'Malformed activity',
        performedBy: mockUserId,
        timestamp: null, // Invalid timestamp
        metadata: {}
      } as any;
      
      const mockTicket = createMockTicket('Complete', [malformedActivity]);
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      // Should handle gracefully and not crash
      const result = await ticketService.canTicketBeReopened(mockTicketId);

      expect(result.canReopen).toBe(true); // Will default to current time, so within window
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full workflow: Complete -> Reopen -> Complete -> Auto-close', async () => {
      // 1. Start with a completed ticket
      let mockTicket = createMockTicket('Complete', [
        createActivityLogEntry('Work Completed', 'Initial completion', 2)
      ]);
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);
      
      // 2. Check it can be reopened
      const reopenCheck = await ticketService.canTicketBeReopened(mockTicketId);
      expect(reopenCheck.canReopen).toBe(true);
      expect(reopenCheck.daysRemaining).toBe(5);

      // 3. Reopen the ticket (mock the service call)
      jest.spyOn(ticketService, 'canTicketBeReopened').mockResolvedValue({
        canReopen: true,
        daysRemaining: 5
      });
      
      const updateDoc = require('firebase/firestore').updateDoc;
      updateDoc.mockResolvedValue(undefined);

      await expect(ticketService.reopenTicket(mockTicketId, mockUserId))
        .resolves
        .not.toThrow();

      // 4. Complete the ticket again (simulate 8 days later)
      mockTicket = createMockTicket('Complete', [
        createActivityLogEntry('Work Completed', 'Re-completion', 10) // Now 10 days old
      ]);
      
      jest.spyOn(ticketService, 'getTicketById').mockResolvedValue(mockTicket);

      // 5. Check it's now eligible for auto-closure
      const getDocs = require('firebase/firestore').getDocs;
      getDocs.mockResolvedValue({
        docs: [{ id: mockTicketId, data: () => mockTicket }]
      });

      const eligibleTickets = await ticketService.getTicketsEligibleForAutoClosure();
      expect(eligibleTickets).toHaveLength(1);
      expect(eligibleTickets[0].id).toBe(mockTicketId);
    });
  });
});
