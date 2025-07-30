import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'

admin.initializeApp()

const db = admin.firestore()

// Function to send quote request emails
export const sendQuoteRequestEmail = functions.firestore
  .document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const quoteRequest = snap.data()
    
    if (quoteRequest.status !== 'requested') {
      return null
    }

    try {
      // Create email transporter inside the function to avoid initialization issues
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: functions.config().email?.user || process.env.EMAIL_USER,
          pass: functions.config().email?.password || process.env.EMAIL_PASSWORD
        }
      })

      // Get ticket details
      const ticketDoc = await db.collection('tickets').doc(quoteRequest.ticketId).get()
      const ticket = ticketDoc.data()
      
      if (!ticket) {
        console.error('Ticket not found:', quoteRequest.ticketId)
        return null
      }

      // Get supplier details
      const supplierDoc = await db.collection('suppliers').doc(quoteRequest.supplierId).get()
      const supplier = supplierDoc.data()
      
      if (!supplier) {
        console.error('Supplier not found:', quoteRequest.supplierId)
        return null
      }

      // Get requester details
      const requesterDoc = await db.collection('users').doc(quoteRequest.requestedBy).get()
      const requester = requesterDoc.data()

      // Email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Quote Request - Building Management System</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details</h3>
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
            <p><strong>Location:</strong> ${ticket.location}</p>
            <p><strong>Urgency:</strong> ${ticket.urgency}</p>
            <p><strong>Requested By:</strong> ${requester?.name || 'Unknown'}</p>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Action Required</h3>
            <p>Please review this ticket and submit your quote within 7 days.</p>
            <p><strong>Quote Request Expires:</strong> ${new Date(quoteRequest.expiresAt.toDate()).toLocaleDateString()}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">How to Submit Your Quote</h3>
            <ol>
              <li>Log into the Building Management System</li>
              <li>Navigate to the Quotes section</li>
              <li>Find this ticket (ID: ${ticket.id})</li>
              <li>Click "Submit Quote" and provide your pricing and terms</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated message from the Building Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `

      // Send email
      const mailOptions = {
        from: functions.config().email?.user || process.env.EMAIL_USER,
        to: supplier.email,
        subject: `Quote Request - Ticket #${ticket.id} - ${ticket.title}`,
        html: emailContent
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('Quote request email sent to:', supplier.email, 'Message ID:', result.messageId)

      // Update the quote request with email sent status
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      })

      return result
    } catch (error) {
      console.error('Error sending quote request email:', error)
      throw error
    }
  })

// Function to send quote submission confirmation
export const sendQuoteSubmissionEmail = functions.firestore
  .document('quotes/{quoteId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data()
    const previousData = change.before.data()
    
    // Only trigger when quote is first submitted (status changes to 'pending')
    if (previousData.status !== 'requested' || newData.status !== 'pending') {
      return null
    }

    try {
      // Create email transporter inside the function
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: functions.config().email?.user || process.env.EMAIL_USER,
          pass: functions.config().email?.password || process.env.EMAIL_PASSWORD
        }
      })

      // Get ticket details
      const ticketDoc = await db.collection('tickets').doc(newData.ticketId).get()
      const ticket = ticketDoc.data()
      
      if (!ticket) {
        console.error('Ticket not found:', newData.ticketId)
        return null
      }

      // Get supplier details
      const supplierDoc = await db.collection('suppliers').doc(newData.supplierId).get()
      const supplier = supplierDoc.data()
      
      if (!supplier) {
        console.error('Supplier not found:', newData.supplierId)
        return null
      }

      // Email content for quote submission confirmation
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Quote Submitted Successfully</h2>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Quote Details</h3>
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
            <p><strong>Ticket Title:</strong> ${ticket.title}</p>
            <p><strong>Amount:</strong> $${newData.amount?.toLocaleString() || 'N/A'}</p>
            <p><strong>Valid Until:</strong> ${newData.validUntil?.toDate().toLocaleDateString() || 'N/A'}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Quote Description</h3>
            <p>${newData.description || 'No description provided'}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Next Steps</h3>
            <p>Your quote has been submitted and is under review. You will be notified when a decision is made.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated message from the Building Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `

      // Send confirmation email to supplier
      const mailOptions = {
        from: functions.config().email?.user || process.env.EMAIL_USER,
        to: supplier.email,
        subject: `Quote Submitted - Ticket #${ticket.id}`,
        html: emailContent
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('Quote submission confirmation sent to:', supplier.email)

      return result
    } catch (error) {
      console.error('Error sending quote submission email:', error)
      throw error
    }
  }) 