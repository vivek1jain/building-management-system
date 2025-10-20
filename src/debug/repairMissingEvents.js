// Repair utility to create missing events for scheduled tickets
// Run this in browser console when on the Events page

window.repairMissingEvents = async function() {
  console.log('🔧 Starting repair of missing events...');
  
  try {
    // Import Firebase functions
    const { collection, getDocs, query, orderBy, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');
    
    console.log('📋 Finding scheduled tickets without events...');
    
    // Get all scheduled tickets
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const ticketsSnapshot = await getDocs(ticketsQuery);
    
    const scheduledTickets = [];
    ticketsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Scheduled') {
        scheduledTickets.push({
          id: doc.id,
          ...data,
          scheduledDate: data.scheduledDate?.toDate ? data.scheduledDate.toDate() : new Date(data.scheduledDate)
        });
      }
    });
    
    // Get all events
    const eventsQuery = query(collection(db, 'buildingEvents'), orderBy('startDate', 'desc'));
    const eventsSnapshot = await getDocs(eventsQuery);
    
    const existingTicketEvents = new Set();
    eventsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.ticketId) {
        existingTicketEvents.add(data.ticketId);
      }
    });
    
    // Find tickets missing events
    const missingEventTickets = scheduledTickets.filter(ticket => 
      !existingTicketEvents.has(ticket.id)
    );
    
    console.log('🔍 Found tickets missing events:', missingEventTickets.length);
    missingEventTickets.forEach(ticket => {
      console.log(`- ${ticket.title} (${ticket.id})`);
    });
    
    if (missingEventTickets.length === 0) {
      console.log('✅ No missing events found - all scheduled tickets have events');
      return { success: true, created: 0 };
    }
    
    // Create events for missing tickets
    const createdEvents = [];
    for (const ticket of missingEventTickets) {
      console.log(`🔧 Creating event for ticket: ${ticket.title}`);
      
      // Use scheduled date or create a default date
      let eventStartDate = ticket.scheduledDate;
      if (!eventStartDate || isNaN(eventStartDate.getTime())) {
        // Fallback to tomorrow at 9 AM if no valid scheduled date
        eventStartDate = new Date();
        eventStartDate.setDate(eventStartDate.getDate() + 1);
        eventStartDate.setHours(9, 0, 0, 0);
        console.log(`⚠️ Using fallback date for ${ticket.title}: ${eventStartDate.toISOString()}`);
      }
      
      // Calculate end date (2 hours after start)
      const eventEndDate = new Date(eventStartDate);
      eventEndDate.setHours(eventEndDate.getHours() + 2);
      
      const eventData = {
        title: `Work: ${ticket.title}`,
        description: `Scheduled work for ticket: ${ticket.description}`,
        location: ticket.location,
        buildingId: ticket.buildingId,
        startDate: eventStartDate,
        endDate: eventEndDate,
        ticketId: ticket.id,
        assignedTo: ticket.assignedTo ? [ticket.assignedTo] : [],
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log(`📅 Creating event:`, {
        title: eventData.title,
        buildingId: eventData.buildingId,
        ticketId: eventData.ticketId,
        startDate: eventData.startDate.toISOString()
      });
      
      try {
        const docRef = await addDoc(collection(db, 'buildingEvents'), eventData);
        console.log(`✅ Created event ${docRef.id} for ticket ${ticket.title}`);
        createdEvents.push({ eventId: docRef.id, ticketId: ticket.id, ticketTitle: ticket.title });
      } catch (eventError) {
        console.error(`❌ Failed to create event for ${ticket.title}:`, eventError);
      }
    }
    
    console.log(`🎉 Repair complete! Created ${createdEvents.length} events`);
    createdEvents.forEach(event => {
      console.log(`✅ Event ${event.eventId} for "${event.ticketTitle}"`);
    });
    
    return { 
      success: true, 
      created: createdEvents.length,
      events: createdEvents,
      missingTickets: missingEventTickets.map(t => ({ id: t.id, title: t.title }))
    };
    
  } catch (error) {
    console.error('❌ Repair error:', error);
    return { success: false, error: error.message };
  }
};

console.log('🔧 Repair utility loaded. Run repairMissingEvents() to fix missing events.');
