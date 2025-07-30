import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface QuoteRequestEmail {
  ticketId: string
  supplierId: string
  supplierEmail: string
  supplierName: string
  ticketTitle: string
  ticketDescription: string
  ticketLocation: string
  ticketUrgency: string
  requestedBy: string
  expiresAt: Date
}

class EmailService {
  private emailLogsCollection = collection(db, 'emailLogs')

  // Generate quote request email template
  generateQuoteRequestEmail(data: QuoteRequestEmail): EmailTemplate {
    const subject = `Quote Request - Ticket #${data.ticketId} - ${data.ticketTitle}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Quote Request - Building Management System</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Ticket Details</h3>
          <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
          <p><strong>Title:</strong> ${data.ticketTitle}</p>
          <p><strong>Description:</strong> ${data.ticketDescription}</p>
          <p><strong>Location:</strong> ${data.ticketLocation}</p>
          <p><strong>Urgency:</strong> ${data.ticketUrgency}</p>
          <p><strong>Requested By:</strong> ${data.requestedBy}</p>
        </div>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Action Required</h3>
          <p>Please review this ticket and submit your quote within 7 days.</p>
          <p><strong>Quote Request Expires:</strong> ${data.expiresAt.toLocaleDateString()}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">How to Submit Your Quote</h3>
          <ol>
            <li>Log into the Building Management System</li>
            <li>Navigate to the Quotes section</li>
            <li>Find this ticket (ID: ${data.ticketId})</li>
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

    const text = `
      Quote Request - Building Management System
      
      Ticket Details:
      - Ticket ID: ${data.ticketId}
      - Title: ${data.ticketTitle}
      - Description: ${data.ticketDescription}
      - Location: ${data.ticketLocation}
      - Urgency: ${data.ticketUrgency}
      - Requested By: ${data.requestedBy}
      
      Action Required:
      Please review this ticket and submit your quote within 7 days.
      Quote Request Expires: ${data.expiresAt.toLocaleDateString()}
      
      How to Submit Your Quote:
      1. Log into the Building Management System
      2. Navigate to the Quotes section
      3. Find this ticket (ID: ${data.ticketId})
      4. Click "Submit Quote" and provide your pricing and terms
      
      This is an automated message from the Building Management System.
      Please do not reply to this email.
    `

    return { subject, html, text }
  }

  // Log email for tracking (this would be replaced with actual email sending)
  async logEmailRequest(emailData: QuoteRequestEmail, template: EmailTemplate): Promise<void> {
    try {
      await addDoc(this.emailLogsCollection, {
        type: 'quote_request',
        to: emailData.supplierEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        ticketId: emailData.ticketId,
        supplierId: emailData.supplierId,
        status: 'pending',
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error logging email request:', error)
      throw new Error('Failed to log email request')
    }
  }

  // Simulate email sending (for development/testing)
  async sendQuoteRequestEmail(emailData: QuoteRequestEmail): Promise<boolean> {
    try {
      const template = this.generateQuoteRequestEmail(emailData)
      
      // Log the email request
      await this.logEmailRequest(emailData, template)
      
      // In a real implementation, you would send the actual email here
      // For now, we'll just simulate success
      console.log('Email would be sent to:', emailData.supplierEmail)
      console.log('Subject:', template.subject)
      console.log('HTML Content:', template.html)
      
      return true
    } catch (error) {
      console.error('Error sending quote request email:', error)
      return false
    }
  }

  // Get email logs for a ticket
  async getEmailLogsForTicket(ticketId: string): Promise<any[]> {
    // This would query the emailLogs collection
    // Implementation depends on your needs
    return []
  }
}

export const emailService = new EmailService() 