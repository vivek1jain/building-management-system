// Debug utility to check Firebase data
// Run this in browser console when on the Events page

window.debugFirebaseData = async function() {
  console.log('🔍 Starting Firebase data debug...');
  
  try {
    // Import Firebase functions
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    
    console.log('📋 Checking tickets...');
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const ticketsSnapshot = await getDocs(ticketsQuery);
    
    const scheduledTickets = [];
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Scheduled') {
        scheduledTickets.push({
          id: doc.id,
          title: data.title,
          status: data.status,
          buildingId: data.buildingId,
          scheduledDate: data.scheduledDate,
          location: data.location
        });
      }
    });
    
    console.log('📋 Found scheduled tickets:', scheduledTickets);
    
    console.log('📅 Checking events...');
    const eventsQuery = query(collection(db, 'buildingEvents'), orderBy('startDate', 'desc'));
    const eventsSnapshot = await getDocs(eventsQuery);
    
    const allEvents = [];
    const ticketEvents = [];
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      const event = {
        id: doc.id,
        title: data.title,
        buildingId: data.buildingId,
        status: data.status,
        ticketId: data.ticketId,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
        location: data.location
      };
      
      allEvents.push(event);
      
      if (data.ticketId) {
        ticketEvents.push(event);
      }
    });
    
    console.log('📅 Found all events:', allEvents);
    console.log('🎫 Found ticket events:', ticketEvents);
    
    // Check for missing events
    console.log('🔍 Checking for missing events...');
    scheduledTickets.forEach(ticket => {
      const hasEvent = ticketEvents.some(event => event.ticketId === ticket.id);
      console.log(`Ticket ${ticket.title} (${ticket.id}): ${hasEvent ? '✅ Has event' : '❌ Missing event'}`);
    });
    
    // Check building IDs
    console.log('🏢 Building ID analysis:');
    console.log('Scheduled tickets building IDs:', [...new Set(scheduledTickets.map(t => t.buildingId))]);
    console.log('Event building IDs:', [...new Set(allEvents.map(e => e.buildingId))]);
    console.log('Ticket event building IDs:', [...new Set(ticketEvents.map(e => e.buildingId))]);
    
    return {
      scheduledTickets,
      allEvents,
      ticketEvents,
      summary: {
        scheduledTicketsCount: scheduledTickets.length,
        totalEventsCount: allEvents.length,
        ticketEventsCount: ticketEvents.length,
        missingEvents: scheduledTickets.filter(ticket => 
          !ticketEvents.some(event => event.ticketId === ticket.id)
        )
      }
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
};

console.log('🛠️ Debug utility loaded. Run debugFirebaseData() in console to check data.');
