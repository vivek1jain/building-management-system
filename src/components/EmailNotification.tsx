import React, { useState, useEffect } from 'react'
import { Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

interface EmailLog {
  id: string
  type: string
  to: string
  subject: string
  status: 'pending' | 'sent' | 'failed'
  createdAt: any
  ticketId: string
  supplierId: string
}

interface EmailNotificationProps {
  ticketId: string
}

const EmailNotification: React.FC<EmailNotificationProps> = ({ ticketId }) => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticketId) return

    const q = query(
      collection(db, 'emailLogs'),
      where('ticketId', '==', ticketId),
      where('type', '==', 'quote_request'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailLog[]
      
      setEmailLogs(logs)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching email logs:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [ticketId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Mail className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Email sent'
      case 'pending':
        return 'Email queued'
      case 'failed':
        return 'Email failed'
      default:
        return 'Unknown status'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (emailLogs.length === 0) {
    return null
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Mail className="h-5 w-5 mr-2" />
        Email Notifications
      </h3>
      
      <div className="space-y-3">
        {emailLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(log.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Quote request sent to {log.to}
                </p>
                <p className="text-xs text-gray-600">
                  {getStatusText(log.status)} • {log.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {log.subject}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmailNotification 