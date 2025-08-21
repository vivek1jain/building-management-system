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

export interface QuoteWinnerEmail {
  ticketId: string
  supplierId: string
  supplierEmail: string
  supplierName: string
  winningAmount: number
  quoteDetails: any
}

export interface QuoteRejectionEmail {
  ticketId: string
  supplierId: string
  supplierEmail: string
  supplierName: string
  rejectedAmount: number
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

  // Generate quote winner email template
  generateQuoteWinnerEmail(data: QuoteWinnerEmail): EmailTemplate {
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(data.winningAmount)

    const subject = `Congratulations! Your quote has been selected - Ticket #${data.ticketId}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Congratulations! Quote Selected</h2>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #065f46;">Great News!</h3>
          <p>Your quote for <strong>${formattedAmount}</strong> has been selected for Ticket #${data.ticketId}.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Next Steps</h3>
          <ol>
            <li>You will be contacted shortly to schedule the work</li>
            <li>Please prepare any materials or equipment needed</li>
            <li>Review the terms and conditions in your original quote</li>
            <li>Contact the building manager if you have any questions</li>
          </ol>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Important Reminders</h3>
          <ul>
            <li>Maintain the quoted price and terms</li>
            <li>Complete work according to your timeline estimates</li>
            <li>Follow all building safety protocols</li>
            <li>Submit invoices through the system upon completion</li>
          </ul>
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
      Congratulations! Quote Selected - Building Management System
      
      Great News!
      Your quote for ${formattedAmount} has been selected for Ticket #${data.ticketId}.
      
      Next Steps:
      1. You will be contacted shortly to schedule the work
      2. Please prepare any materials or equipment needed
      3. Review the terms and conditions in your original quote
      4. Contact the building manager if you have any questions
      
      Important Reminders:
      - Maintain the quoted price and terms
      - Complete work according to your timeline estimates
      - Follow all building safety protocols
      - Submit invoices through the system upon completion
      
      This is an automated message from the Building Management System.
      Please do not reply to this email.
    `

    return { subject, html, text }
  }

  // Generate quote rejection email template
  generateQuoteRejectionEmail(data: QuoteRejectionEmail): EmailTemplate {
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(data.rejectedAmount)

    const subject = `Quote Update - Ticket #${data.ticketId}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Quote Update - Building Management System</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Thank You for Your Quote</h3>
          <p>We appreciate your quote of <strong>${formattedAmount}</strong> for Ticket #${data.ticketId}.</p>
          <p>After careful consideration, we have selected another supplier for this project.</p>
        </div>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Stay Connected</h3>
          <p>We value our relationship with you and look forward to future opportunities to work together.</p>
          <ul>
            <li>You'll continue to receive quote requests for suitable projects</li>
            <li>Your supplier profile remains active in our system</li>
            <li>We encourage you to participate in future bidding opportunities</li>
          </ul>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Feedback Welcome</h3>
          <p>If you have any feedback on our quote process or would like to discuss how we can better work together in the future, please don't hesitate to reach out.</p>
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
      Quote Update - Building Management System
      
      Thank You for Your Quote
      We appreciate your quote of ${formattedAmount} for Ticket #${data.ticketId}.
      After careful consideration, we have selected another supplier for this project.
      
      Stay Connected
      We value our relationship with you and look forward to future opportunities to work together.
      - You'll continue to receive quote requests for suitable projects
      - Your supplier profile remains active in our system
      - We encourage you to participate in future bidding opportunities
      
      Feedback Welcome
      If you have any feedback on our quote process or would like to discuss how we can better work together in the future, please don't hesitate to reach out.
      
      This is an automated message from the Building Management System.
      Please do not reply to this email.
    `

    return { subject, html, text }
  }

  // Send quote winner email
  async sendQuoteWinnerEmail(emailData: QuoteWinnerEmail): Promise<boolean> {
    try {
      const template = this.generateQuoteWinnerEmail(emailData)
      
      // Log the email
      await addDoc(this.emailLogsCollection, {
        type: 'quote_winner',
        to: emailData.supplierEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        ticketId: emailData.ticketId,
        supplierId: emailData.supplierId,
        winningAmount: emailData.winningAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      
      // Simulate email sending
      console.log('Winner email would be sent to:', emailData.supplierEmail)
      console.log('Subject:', template.subject)
      
      return true
    } catch (error) {
      console.error('Error sending quote winner email:', error)
      return false
    }
  }

  // Send quote rejection email
  async sendQuoteRejectionEmail(emailData: QuoteRejectionEmail): Promise<boolean> {
    try {
      const template = this.generateQuoteRejectionEmail(emailData)
      
      // Log the email
      await addDoc(this.emailLogsCollection, {
        type: 'quote_rejection',
        to: emailData.supplierEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
        ticketId: emailData.ticketId,
        supplierId: emailData.supplierId,
        rejectedAmount: emailData.rejectedAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      
      // Simulate email sending
      console.log('Rejection email would be sent to:', emailData.supplierEmail)
      console.log('Subject:', template.subject)
      
      return true
    } catch (error) {
      console.error('Error sending quote rejection email:', error)
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