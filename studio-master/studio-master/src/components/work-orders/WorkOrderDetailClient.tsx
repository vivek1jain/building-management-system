
"use client";

import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkOrderById, updateWorkOrderFields, getSuppliers, type Supplier } from '@/lib/firebase/firestore';
import type { WorkOrder, QuoteRequest, UserFeedback, LogEntry } from '@/types';
import { WorkOrderStatus, WorkOrderPriority, UserRole, QuoteRequestStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, addDays, isBefore } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Info, MessageSquare, Mail, Edit3, XCircle, Send, CheckCircle, Briefcase, Banknote, Users, ListChecks, CalendarDays, ShoppingCart, Construction, Upload, FileText, Edit2, PackageOpen, SquarePlus, Save, CheckSquare, PlayCircle, DollarSign, ClipboardList, Reply, CircleArrowOutUpRight, RotateCcw, MessageCircleQuestion, MessageCircleMore, CalendarIcon, StickyNote } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, 
  DialogClose,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
  DialogDescription as ShadDialogDescription,
  DialogContent as ShadDialogContent,
  DialogFooter as ShadDialogFooter,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Timestamp, arrayUnion } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditQuoteDialog, type EditQuoteFormValues } from './EditQuoteDialog';
import { ScheduleWorkDialog } from './ScheduleWorkDialog';

type ActivityLogEntry = {
    type: 'User Feedback' | 'Manager Communication' | 'Internal Note' | 'Status Change';
    content: string;
    timestamp: Date;
    author?: string;
};

interface WorkOrderDetailClientProps {
  workOrderId: string;
}

const NO_SUPPLIER_SELECTED_VALUE = "__NO_SUPPLIER__";

function StatusBadge({ status }: { status: WorkOrderStatus }) {
   switch (status) {
    case WorkOrderStatus.TRIAGE:
      return <Badge variant="outline" className="border-orange-400 text-orange-400 bg-orange-400/10"><Construction className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.QUOTING:
      return <Badge variant="outline" className="border-purple-500 text-purple-500 bg-purple-500/10"><ListChecks className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.AWAITING_USER_FEEDBACK:
        return <Badge variant="outline" className="border-pink-500 text-pink-500 bg-pink-500/10"><Users className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.SCHEDULED:
        return <Badge variant="outline" className="border-teal-500 text-teal-500 bg-teal-500/10"><CalendarDays className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.RESOLVED:
      return <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10"><CheckCircle className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.CLOSED:
      return <Badge variant="secondary"><XCircle className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    case WorkOrderStatus.CANCELLED:
      return <Badge variant="destructive" className="bg-gray-500 hover:bg-gray-600"><XCircle className="mr-1 h-3.5 w-3.5" />{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
    switch (priority) {
        case WorkOrderPriority.URGENT: return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">{priority}</Badge>;
        case WorkOrderPriority.HIGH: return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">{priority}</Badge>;
        case WorkOrderPriority.MEDIUM: return <Badge variant="default" className="bg-yellow-500 text-yellow-900 hover:bg-yellow-600">{priority}</Badge>;
        case WorkOrderPriority.LOW: return <Badge variant="secondary">{priority}</Badge>;
        default: return <Badge>{priority}</Badge>;
    }
}

const getInitials = (nameOrEmail: string | null | undefined) => {
    if (!nameOrEmail) return "U";
    const nameParts = nameOrEmail.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[1]) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
     if (nameParts[0] && nameParts[0].length >=2) {
        return nameParts[0].substring(0,2).toUpperCase();
    }
    if (nameOrEmail.includes('@')) {
         return nameOrEmail.substring(0, 2).toUpperCase();
    }
    return nameOrEmail[0] ? nameOrEmail[0].toUpperCase() : "U";
};

export function WorkOrderDetailClient({ workOrderId }: WorkOrderDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workOrder, setWorkOrder] = React.useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newActivityMessage, setNewActivityMessage] = React.useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = React.useState(false);

  const [isScheduleWorkDialogOpen, setIsScheduleWorkDialogOpen] = React.useState(false);
  const [scheduleDialogInitialData, setScheduleDialogInitialData] = React.useState<{ supplierId?: string, quotePrice?: number | null, scheduledDate?: Date | null } | null>(null);

  const [workflowActionDialog, setWorkflowActionDialog] = React.useState<{
    targetStatus: WorkOrderStatus;
    title: string;
    description: string;
    email?: string; 
    suppliersToRequestQuote?: Supplier[];
    selectedSupplierIdsForQuote?: Set<string>; 
    selectedSupplierIdForEngagement?: string | null; 
    estimatedCostForEngagement?: number | null; 
    finalCostForResolution?: number | null; 
    forcedResolutionNotes?: string; 
    requiresCostForResolution?: boolean; 
    requiresResolutionNotesForResolution?: boolean;
    reopenAction?: 'reschedule' | 'retriage'; 
  } | null>(null);

  const [isSubmittingWorkflowAction, setIsSubmittingWorkflowAction] = React.useState(false);

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(true);
  
  const [quoteToEdit, setQuoteToEdit] = React.useState<QuoteRequest | null>(null);
  const [isEditQuoteDialogOpen, setIsEditQuoteDialogOpen] = React.useState(false);
  const [pendingStatusForDialog, setPendingStatusForDialog] = React.useState<QuoteRequestStatus | null>(null);

  const fetchWorkOrderData = React.useCallback(async () => {
    try {
        const orderData = await getWorkOrderById(workOrderId);
        if (orderData) {
            setWorkOrder(orderData);
        } else {
            setError("Work order not found.");
        }
    } catch (err: any) {
        setError(err.message || "Failed to fetch work order details.");
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [workOrderId, toast]);


  React.useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      await fetchWorkOrderData();

      if (user?.role === UserRole.MANAGER) {
        setIsLoadingSuppliers(true);
        try {
          const fetchedSuppliers = await getSuppliers();
          setSuppliers(fetchedSuppliers);
        } catch (err) {
          console.error("Error fetching suppliers for work order detail:", err);
        } finally {
          setIsLoadingSuppliers(false);
        }
      } else {
        setIsLoadingSuppliers(false);
      }
      setIsLoading(false);
    };

    if (workOrderId && user !== undefined) {
        fetchInitialData();
    } else if (!workOrderId) {
        setError("Work Order ID is missing.");
        setIsLoading(false);
    }
  }, [workOrderId, user, fetchWorkOrderData]);

  const combinedActivityLog = React.useMemo(() => {
    if (!workOrder) return [];
    
    let log: { type: string; content: string; timestamp: Date; author?: string; }[] = [];

    if (Array.isArray(workOrder.userFeedbackLog)) {
      workOrder.userFeedbackLog.forEach(fb => {
          log.push({
              type: 'User Feedback',
              content: fb.message,
              timestamp: (fb.timestamp as Timestamp).toDate(),
              author: fb.userName
          });
      });
    }

    if (Array.isArray(workOrder.managerCommunication)) {
      workOrder.managerCommunication.forEach(entry => {
          log.push({
              type: 'Manager Communication',
              content: entry.message,
              timestamp: entry.timestamp.toDate(),
              author: entry.authorName
          });
      });
    }

    if (Array.isArray(workOrder.resolutionNotes)) {
      workOrder.resolutionNotes.forEach(entry => {
          log.push({
              type: 'Internal Note',
              content: entry.message,
              timestamp: entry.timestamp.toDate(),
              author: entry.authorName,
          });
      });
    }

    return log.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [workOrder]);


  const handleActivitySubmit = async (type: 'User Feedback' | 'Internal Note' | 'Manager Communication') => {
    if (!workOrder || !user || !newActivityMessage.trim()) {
        toast({ title: "Cannot Send", description: "Message is empty or user/work order data missing.", variant: "destructive" });
        return;
    }
    setIsSubmittingActivity(true);

    try {
        const newEntry: LogEntry = {
            message: newActivityMessage.trim(),
            timestamp: Timestamp.now(),
            authorId: user.uid,
            authorName: user.displayName || user.email || "User",
        };
        
        let updatePayload: Partial<WorkOrder> = {};
        if (type === 'User Feedback') {
            updatePayload = {
                userFeedbackLog: [newEntry], 
            };
        } else if (type === 'Internal Note') {
            updatePayload = { resolutionNotes: [newEntry] };
        } else if (type === 'Manager Communication') {
            updatePayload = { 
                managerCommunication: [newEntry],
                status: WorkOrderStatus.AWAITING_USER_FEEDBACK,
            };
        }
        
        await updateWorkOrderFields(workOrder.id, user.uid, updatePayload);
        await fetchWorkOrderData();
        setNewActivityMessage('');
        toast({ title: "Activity Logged", description: `Your ${type} has been added.` });
    } catch (err: any) {
        toast({ title: `Error submitting ${type}`, description: err.message, variant: "destructive" });
    } finally {
        setIsSubmittingActivity(false);
    }
  };


  const openGenericWorkflowDialog = (
    targetStatus: WorkOrderStatus,
    title: string,
    description: string,
    options?: {
      initialEmail?: string;
      requiresResolutionNotes?: boolean;
      requiresCostForResolution?: boolean; 
      requiresResolutionNotesForResolution?: boolean;
    }
  ) => {
    setWorkflowActionDialog({
      targetStatus, title, description,
      email: options?.initialEmail,
      forcedResolutionNotes: (options?.requiresResolutionNotes || options?.requiresResolutionNotesForResolution) ? '' : undefined,
      requiresCostForResolution: options?.requiresCostForResolution,
      finalCostForResolution: options?.requiresCostForResolution ? (workOrder?.cost ?? null) : undefined,
      requiresResolutionNotesForResolution: options?.requiresResolutionNotesForResolution,
    });
    if (options?.requiresResolutionNotes || options?.requiresResolutionNotesForResolution) {
        setNewActivityMessage('');
    }
  };
  

  const openRequestQuoteDialog = () => {
    setWorkflowActionDialog({
      targetStatus: WorkOrderStatus.QUOTING, 
      title: "Request Quotes from Suppliers",
      description: "Select one or more suppliers to send a mock quote request. Their contact details will be used if available.",
      suppliersToRequestQuote: suppliers,
      selectedSupplierIdsForQuote: new Set<string>(),
    });
  };
  
  const openEngageSupplierDialog = () => {
    if (!workOrder) return;
    setWorkflowActionDialog({
      targetStatus: WorkOrderStatus.QUOTING, 
      title: "Engage Preferred Supplier",
      description: "Select a supplier to engage and optionally provide an estimated cost. This will move the work order to 'Quoting'.",
      selectedSupplierIdForEngagement: workOrder?.supplierId || NO_SUPPLIER_SELECTED_VALUE,
      estimatedCostForEngagement: workOrder?.cost ?? null, 
    });
  };

  const openScheduleWorkDialog = (supplierIdFromQuote?: string, quotePrice?: number | null) => {
    if (!workOrder) return;
    let initialDate: Date | null = null;
    if (workOrder.scheduledDate) {
        const ts = workOrder.scheduledDate as Timestamp;
        initialDate = ts.toDate();
    }
    setScheduleDialogInitialData({
        supplierId: supplierIdFromQuote || workOrder.supplierId,
        quotePrice: quotePrice ?? workOrder.quotePrice ?? workOrder.cost,
        scheduledDate: initialDate
    });
    setIsScheduleWorkDialogOpen(true);
  };

  const openResolveDialog = () => {
    openGenericWorkflowDialog(
        WorkOrderStatus.RESOLVED,
        "Resolve Work Order",
        "Confirm work completion. Provide final cost and resolution notes.",
        { 
          initialEmail: workOrder?.createdByUserEmail, 
          requiresCostForResolution: true, 
          requiresResolutionNotesForResolution: true 
        }
    );
  };

  const openReopenDialog = () => {
    setWorkflowActionDialog({
        targetStatus: WorkOrderStatus.TRIAGE, 
        title: "Reopen Work Order",
        description: "Choose an action for this reopened work order.",
        reopenAction: 'retriage', 
    });
  };

 const handleUpdateQuoteStatus = async (quoteRequestSupplierId: string, newStatus: QuoteRequestStatus, updatedQuoteData?: Partial<QuoteRequest>) => {
    if (!workOrder || !user) return;
    const currentQuote = workOrder.quoteRequests?.find(qr => qr.supplierId === quoteRequestSupplierId);
    if (!currentQuote) return;

    if ((newStatus === QuoteRequestStatus.ACCEPTED || newStatus === QuoteRequestStatus.RECEIVED)) {
        const quoteAmount = updatedQuoteData?.quoteAmount ?? currentQuote.quoteAmount;
        if ((quoteAmount === null || quoteAmount === undefined)) {
            setQuoteToEdit({ ...currentQuote, ...updatedQuoteData, status: newStatus });
            setPendingStatusForDialog(newStatus);
            setIsEditQuoteDialogOpen(true);
            return;
        }
    }
    
    if (newStatus === QuoteRequestStatus.ACCEPTED) {
        const alreadyAcceptedQuote = workOrder.quoteRequests?.find(qr => qr.supplierId !== quoteRequestSupplierId && qr.status === QuoteRequestStatus.ACCEPTED);
        if (alreadyAcceptedQuote) {
            toast({
                title: "Action Prevented",
                description: `"${alreadyAcceptedQuote.supplierName}"'s quote is already accepted. Please change its status first.`,
                variant: "destructive",
                duration: 7000,
            });
            return;
        }
    }

    const baseUpdatedQuote = { ...currentQuote, ...updatedQuoteData };
    let updatedQuoteRequests = [...(workOrder.quoteRequests || [])];
    const updatePayload: Partial<WorkOrder> = {};
    let toastDescription = "";

    const createUpdatedQuote = (qr: QuoteRequest, status: QuoteRequestStatus): QuoteRequest => ({
        ...qr,
        ... (qr.supplierId === quoteRequestSupplierId ? updatedQuoteData : {}),
        status,
        updatedAt: Timestamp.now(),
    });

    if (currentQuote.status === QuoteRequestStatus.ACCEPTED && newStatus !== QuoteRequestStatus.ACCEPTED) {
        updatedQuoteRequests = updatedQuoteRequests.map(qr =>
          qr.supplierId === quoteRequestSupplierId
            ? createUpdatedQuote(qr, newStatus)
            : (qr.status === QuoteRequestStatus.REJECTED ? createUpdatedQuote(qr, QuoteRequestStatus.RECEIVED) : qr)
        );
        updatePayload.quoteRequests = updatedQuoteRequests;
        updatePayload.supplierId = null;
        updatePayload.supplierName = null;
        updatePayload.quotePrice = null;
        updatePayload.status = WorkOrderStatus.QUOTING;
        toastDescription = `Accepted quote for ${baseUpdatedQuote.supplierName} rolled back. Others reopened.`;
    } else if (newStatus === QuoteRequestStatus.ACCEPTED) {
        updatedQuoteRequests = updatedQuoteRequests.map(qr =>
            qr.supplierId === quoteRequestSupplierId
            ? createUpdatedQuote(qr, newStatus)
            : (qr.status === QuoteRequestStatus.PENDING || qr.status === QuoteRequestStatus.RECEIVED ? createUpdatedQuote(qr, QuoteRequestStatus.REJECTED) : qr)
        );
        updatePayload.quoteRequests = updatedQuoteRequests;
        updatePayload.supplierId = baseUpdatedQuote.supplierId;
        updatePayload.supplierName = baseUpdatedQuote.supplierName;
        updatePayload.quotePrice = baseUpdatedQuote.quoteAmount;
        updatePayload.status = WorkOrderStatus.QUOTING;
        toastDescription = `Quote for ${baseUpdatedQuote.supplierName} accepted. Others marked rejected.`;
    } else {
        updatedQuoteRequests = updatedQuoteRequests.map(qr =>
            qr.supplierId === quoteRequestSupplierId ? createUpdatedQuote(qr, newStatus) : qr
        );
        updatePayload.quoteRequests = updatedQuoteRequests;
        toastDescription = `Quote status for ${baseUpdatedQuote.supplierName} updated to ${newStatus}.`;
    }

    try {
        setIsSubmittingWorkflowAction(true);
        await updateWorkOrderFields(workOrder.id, user.uid, updatePayload);
        const reFetchedWorkOrder = await getWorkOrderById(workOrderId);
        if (reFetchedWorkOrder) setWorkOrder(reFetchedWorkOrder);
        toast({ title: "Quote Status Updated", description: toastDescription, duration: 7000 });
    } catch (err: any) {
        toast({ title: "Error Updating Quote Status", description: err.message, variant: "destructive" });
    } finally {
        setIsSubmittingWorkflowAction(false);
    }
  };

 const handleSaveQuoteFromDialog = async (updatedQuoteData: EditQuoteFormValues) => {
    if (!workOrder || !user || !quoteToEdit) return;

    const { quoteAmount, notes, quoteDocumentUrl } = updatedQuoteData;
    const finalStatus = pendingStatusForDialog || updatedQuoteData.status || quoteToEdit.status;
    setPendingStatusForDialog(null);

    if ((finalStatus === QuoteRequestStatus.ACCEPTED || finalStatus === QuoteRequestStatus.RECEIVED) && (quoteAmount === null || quoteAmount === undefined)) {
        toast({
            title: "Amount Required",
            description: "An amount is required to move to this status.",
            variant: "destructive"
        });
        return;
    }
    
    await handleUpdateQuoteStatus(quoteToEdit.supplierId, finalStatus, { quoteAmount, notes, quoteDocumentUrl });
 };

  const handleConfirmWorkflowAction = async () => {
    if (!workOrder || !user || !workflowActionDialog) return;

    setIsSubmittingWorkflowAction(true);
    const { targetStatus, email, selectedSupplierIdsForQuote, selectedSupplierIdForEngagement, estimatedCostForEngagement, finalCostForResolution, forcedResolutionNotes, requiresCostForResolution, requiresResolutionNotesForResolution, reopenAction } = workflowActionDialog;

    if (email && workflowActionDialog.targetStatus !== WorkOrderStatus.AWAITING_USER_FEEDBACK && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email for notification.", variant: "destructive"});
      setIsSubmittingWorkflowAction(false); return;
    }
    if (requiresCostForResolution && (finalCostForResolution === null || finalCostForResolution === undefined || finalCostForResolution < 0)) {
        toast({ title: "Cost Required", description: "A final cost (even £0.00) must be entered.", variant: "destructive"});
        setIsSubmittingWorkflowAction(false); return;
    }
    if ( ( (forcedResolutionNotes !== undefined && targetStatus === WorkOrderStatus.CANCELLED) || 
           (requiresResolutionNotesForResolution && targetStatus === WorkOrderStatus.RESOLVED)
         ) && !newActivityMessage.trim() ) {
        toast({ title: "Notes Required", description: `Please provide ${targetStatus === WorkOrderStatus.CANCELLED ? 'cancellation' : 'resolution'} notes.`, variant: "destructive"});
        setIsSubmittingWorkflowAction(false); return;
    }

    let finalTargetStatus = targetStatus;
    if (workflowActionDialog.targetStatus === WorkOrderStatus.TRIAGE && reopenAction) { 
        finalTargetStatus = reopenAction === 'retriage' ? WorkOrderStatus.TRIAGE : WorkOrderStatus.SCHEDULED;
    }


    const updatePayload: Partial<WorkOrder> = { status: finalTargetStatus };
    let toastDescription = `Order status changed to ${finalTargetStatus}.`;
    let mockEmailSummary = "";
    
    const newLogEntry: LogEntry = {
        message: newActivityMessage.trim(),
        timestamp: Timestamp.now(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Manager'
    };

    if (finalTargetStatus === WorkOrderStatus.CANCELLED && forcedResolutionNotes !== undefined) {
        updatePayload.resolutionNotes = [newLogEntry];
    }
    if (finalTargetStatus === WorkOrderStatus.RESOLVED) {
        if (finalCostForResolution !== undefined && finalCostForResolution !== null) {
            updatePayload.cost = finalCostForResolution;
        }
        if (requiresResolutionNotesForResolution) {
            updatePayload.resolutionNotes = [newLogEntry];
        }
        updatePayload.resolvedAt = Timestamp.now();
    }

    if (estimatedCostForEngagement !== undefined && estimatedCostForEngagement !== null && workflowActionDialog.targetStatus === WorkOrderStatus.QUOTING && selectedSupplierIdForEngagement) {
        updatePayload.cost = estimatedCostForEngagement; 
    }
    
    if (finalTargetStatus === WorkOrderStatus.AWAITING_USER_FEEDBACK && email) {
        updatePayload.managerCommunication = [newLogEntry];
        mockEmailSummary = `Mock communication sent to ${email}.`;
    }

    if (workflowActionDialog.targetStatus === WorkOrderStatus.QUOTING && selectedSupplierIdsForQuote) { 
      if (!selectedSupplierIdsForQuote || selectedSupplierIdsForQuote.size === 0) {
        toast({ title: "Suppliers Needed", description: "Please select at least one supplier to request quotes from.", variant: "destructive" });
        setIsSubmittingWorkflowAction(false); return;
      }
      let currentQuoteRequests = [...(workOrder.quoteRequests || [])];
      let supplierNamesForToast: string[] = [];

      for (const supplierId of selectedSupplierIdsForQuote) {
          const supplier = suppliers.find(s => s.id === supplierId);
          if (!supplier) continue;
          const existingQrIndex = currentQuoteRequests.findIndex(qr => qr.supplierId === supplierId);
          if (existingQrIndex > -1) { 
              const currentQr = currentQuoteRequests[existingQrIndex];
              currentQuoteRequests[existingQrIndex] = { ...currentQr, sentAt: Timestamp.now(), status: QuoteRequestStatus.PENDING, updatedAt: Timestamp.now() };
              supplierNamesForToast.push(supplier.name + " (re-requested)");
          } else { 
              currentQuoteRequests.push({
                  supplierId: supplier.id, supplierName: supplier.name, sentAt: Timestamp.now(), status: QuoteRequestStatus.PENDING,
                  quoteAmount: null, quoteDocumentUrl: null, notes: null, updatedAt: Timestamp.now(),
              });
              supplierNamesForToast.push(supplier.name + " (new request)");
          }
      }
      updatePayload.quoteRequests = currentQuoteRequests;
      mockEmailSummary = `Mock quote request actions performed for: ${supplierNamesForToast.join(', ')}.`;
    } else if (workflowActionDialog.targetStatus === WorkOrderStatus.QUOTING && selectedSupplierIdForEngagement) { 
        const supplier = suppliers.find(s => s.id === selectedSupplierIdForEngagement);
        if (!supplier) {
            toast({ title: "Supplier Error", description: "Selected supplier not found.", variant: "destructive" });
            setIsSubmittingWorkflowAction(false); return;
        }
        updatePayload.supplierId = supplier.id;
        updatePayload.supplierName = supplier.name;
        if (estimatedCostForEngagement !== null) updatePayload.cost = estimatedCostForEngagement;
        
        mockEmailSummary = `Preferred supplier ${supplier.name} selected. Ready to schedule.`;
    } else if ((finalTargetStatus === WorkOrderStatus.CLOSED || finalTargetStatus === WorkOrderStatus.CANCELLED || finalTargetStatus === WorkOrderStatus.RESOLVED) && email) {
        mockEmailSummary = `Mock ${finalTargetStatus.toLowerCase()} email sent to ${email}.`;
    }

    try {
      await updateWorkOrderFields(workOrder.id, user.uid, updatePayload);
      const updatedWO = await getWorkOrderById(workOrderId);
      if (updatedWO) {
          setWorkOrder(updatedWO);
      }
      setNewActivityMessage('');
      toast({ title: "Work Order Updated", description: `${toastDescription} ${mockEmailSummary}`, duration: 7000 });
      setWorkflowActionDialog(null);
    } catch (err: any) {
      toast({ title: "Error Updating Order", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmittingWorkflowAction(false);
    }
  };


  const isTerminalStatus = workOrder ? workOrder.status === WorkOrderStatus.CLOSED || workOrder.status === WorkOrderStatus.CANCELLED : false;
  const isResolvedStatus = workOrder ? workOrder.status === WorkOrderStatus.RESOLVED : false;

  const canReopen = workOrder?.resolvedAt && isBefore(new Date(), addDays(workOrder.resolvedAt.toDate(), 7));


  if (isLoading && !workOrder) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          <Skeleton className="h-64 md:flex-1" />
          <div className="md:w-[320px] lg:w-[350px] flex-shrink-0"><Skeleton className="h-64 w-full" /></div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 text-lg font-semibold text-destructive">Error Loading Work Order</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-10">
        <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-semibold">Work Order Not Found</p>
        <p className="text-muted-foreground">The requested work order could not be loaded.</p>
      </div>
    );
  }

  const isManager = user?.role === UserRole.MANAGER;
  const isOriginator = user?.uid === workOrder.createdByUid;


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-x-6 gap-y-4 mb-6">
        <Card className="shadow-lg md:flex-1 h-64 flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center">
                    <ClipboardList className="mr-3 h-7 w-7 text-primary" />
                    {workOrder.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3 flex-grow flex flex-col min-h-0">
                <ScrollArea className="flex-grow">
                    <p className="text-muted-foreground whitespace-pre-wrap max-w-3xl">{workOrder.description}</p>
                    {workOrder.flatNumber && (
                        <div className="mt-4 pt-3 border-t">
                            <h4 className="text-sm font-medium text-foreground/80">Associated Flat</h4>
                            <p className="text-sm text-muted-foreground">{workOrder.flatNumber}</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
        <Card className="shadow-sm md:w-[320px] lg:w-[350px] flex-shrink-0 h-64 flex flex-col">
          <CardHeader className="pb-2 pt-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="text-xs pt-0 pb-2.5 px-3 flex-grow flex flex-col min-h-0">
            <ScrollArea className="flex-grow">
                <div className="space-y-2.5 pt-2 pb-1">
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">ID:</span>
                        <span className="font-mono text-foreground text-right truncate">{workOrder.id.substring(0,12)}...</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">Status:</span>
                        <div className="text-right"><StatusBadge status={workOrder.status} /></div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">Priority:</span>
                        <div className="text-right"><PriorityBadge priority={workOrder.priority} /></div>
                    </div>
                    {workOrder.quotePrice !== undefined && workOrder.quotePrice !== null && (
                        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left">Agreed Quote:</span>
                            <span className="font-semibold text-primary text-right">{formatCurrency(workOrder.quotePrice)}</span>
                        </div>
                    )}
                    {workOrder.cost !== undefined && workOrder.cost !== null && (
                        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left">Final Cost:</span>
                            <span className="font-semibold text-primary text-right">{formatCurrency(workOrder.cost)}</span>
                        </div>
                    )}
                    {workOrder.scheduledDate && (
                        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left flex items-center"><CalendarDays className="mr-1.5 h-3 w-3"/>Scheduled:</span>
                            <span className="text-foreground text-right">{workOrder.scheduledDate.toDate ? format(workOrder.scheduledDate.toDate(), 'PP') : 'N/A'}</span>
                        </div>
                    )}
                    {workOrder.flatNumber && isManager && (
                        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left flex items-center"><Users className="mr-1.5 h-3 w-3"/>Flat:</span>
                            <span className="text-foreground text-right">{workOrder.flatNumber}</span>
                        </div>
                    )}
                    <Separator className="my-1.5"/>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">Created By:</span>
                        <span className="text-foreground text-right truncate">{workOrder.createdByUserEmail}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">Created:</span>
                        <span className="text-foreground text-right">{workOrder.createdAt?.toDate ? formatDistanceToNow(workOrder.createdAt.toDate(), { addSuffix: true }) : 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                        <span className="text-muted-foreground text-left">Last Updated:</span>
                        <span className="text-foreground text-right">{workOrder.updatedAt instanceof Date ? formatDistanceToNow(workOrder.updatedAt, { addSuffix: true }) : workOrder.updatedAt?.toDate ? formatDistanceToNow(workOrder.updatedAt.toDate(), { addSuffix: true }) : 'N/A'}</span>
                    </div>
                    {workOrder.supplierName && (
                        <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left flex items-center"><Briefcase className="mr-1.5 h-3 w-3"/>Engaged Supplier:</span>
                            <span className="text-foreground text-right truncate">{workOrder.supplierName}</span>
                        </div>
                    )}
                    {workOrder.resolvedAt && (
                         <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                            <span className="text-muted-foreground text-left flex items-center"><CheckSquare className="mr-1.5 h-3 w-3"/>Resolved:</span>
                            <span className="text-foreground text-right">{workOrder.resolvedAt.toDate ? format(workOrder.resolvedAt.toDate(), 'PP p') : 'N/A'}</span>
                        </div>
                    )}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {isManager && (
        <Card className="shadow-lg w-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Manager Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {workOrder.status === WorkOrderStatus.TRIAGE && (
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={openRequestQuoteDialog} disabled={isLoadingSuppliers} size="sm">
                            {isLoadingSuppliers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SquarePlus className="mr-2 h-4 w-4"/>}
                            Start Quote Process
                        </Button>
                        <Button onClick={openEngageSupplierDialog} variant="outline" disabled={isLoadingSuppliers} size="sm">
                            {isLoadingSuppliers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleArrowOutUpRight className="mr-2 h-4 w-4"/>}
                            Engage Preferred Supplier
                        </Button>
                    </div>
                )}
                {workOrder.status === WorkOrderStatus.QUOTING && (
                    <Card className="shadow-sm flex flex-col">
                        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center"><ListChecks className="mr-2 h-5 w-5 text-muted-foreground"/>Supplier Quotes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {(workOrder.quoteRequests?.length ?? 0) > 0 ? (
                                <ScrollArea className="max-h-60">
                                    <Table><TableHeader><TableRow><TableHead className="text-xs">Supplier</TableHead><TableHead className="text-xs text-center">Status</TableHead><TableHead className="text-xs text-right">Amount (£)</TableHead><TableHead className="text-xs text-center">Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {workOrder.quoteRequests?.map((req, index) => {
                                        const isThisQuoteAccepted = req.status === QuoteRequestStatus.ACCEPTED;
                                        return (
                                            <TableRow key={index}>
                                            <TableCell className="font-medium text-xs py-1.5">{req.supplierName}</TableCell>
                                            <TableCell className="text-center w-36 py-1.5">
                                                <Select value={req.status || QuoteRequestStatus.PENDING} onValueChange={(newStatus) => handleUpdateQuoteStatus(req.supplierId, newStatus as QuoteRequestStatus)} disabled={isSubmittingWorkflowAction}>
                                                    <SelectTrigger className="h-7 text-xs"><SelectValue/></SelectTrigger>
                                                    <SelectContent>{Object.values(QuoteRequestStatus).map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right w-32 py-1.5">
                                                {req.quoteAmount !== null && req.quoteAmount !== undefined ? formatCurrency(req.quoteAmount) : <span className="text-xs italic">N/A</span>}
                                            </TableCell>
                                            <TableCell className="text-center py-1.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setQuoteToEdit(req); setIsEditQuoteDialogOpen(true); }}><Edit2 className="h-3.5 w-3.5"/></Button>
                                                    {isThisQuoteAccepted && (<Button variant="default" size="xs" className="bg-accent hover:bg-accent/90 h-7 text-xs" onClick={() => openScheduleWorkDialog(req.supplierId, req.quoteAmount)}>Schedule</Button>)}
                                                </div>
                                            </TableCell>
                                            </TableRow>
                                        );})}
                                    </TableBody></Table>
                                </ScrollArea>
                            ) : workOrder.supplierId ? (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                    <p className="text-sm">Preferred Supplier: <strong>{workOrder.supplierName}</strong> {workOrder.cost ? `(Est. ${formatCurrency(workOrder.cost)})` : ''}</p>
                                    <Button size="sm" onClick={() => openScheduleWorkDialog()}>Schedule Work</Button>
                                </div>
                            ) : (<p className="text-sm text-muted-foreground italic pt-2">No quote requests active. Use &quot;Start Quote Process&quot; or &quot;Engage Preferred Supplier&quot; from Triage.</p>) }
                             {!workOrder.supplierId && !(workOrder.quoteRequests?.some(qr => qr.status === QuoteRequestStatus.ACCEPTED)) && (
                                <Button onClick={openRequestQuoteDialog} disabled={isLoadingSuppliers} className="w-full sm:w-auto self-start" size="sm" variant="outline">
                                    {isLoadingSuppliers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SquarePlus className="mr-2 h-4 w-4"/>} Add/Re-request Quotes
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
                {workOrder.status === WorkOrderStatus.SCHEDULED && (
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={openResolveDialog} size="sm" className="bg-green-600 hover:bg-green-700">Mark as Complete</Button>
                        <Button onClick={() => openScheduleWorkDialog()} variant="outline" size="sm">Reschedule Work</Button>
                    </div>
                )}
                 {workOrder.status === WorkOrderStatus.AWAITING_USER_FEEDBACK && (
                    <div className="border p-3 rounded-md bg-amber-50">
                        <p className="text-sm font-medium text-amber-700 mb-2">User has provided feedback. Please review and take action:</p>
                        <div className="flex flex-wrap gap-2">
                            <Button size="xs" variant="outline" onClick={() => openGenericWorkflowDialog(WorkOrderStatus.TRIAGE, "Acknowledge & Re-Triage", "Return this work order to the Triage queue.")}>Acknowledge &amp; Re-Triage</Button>
                            <Button size="xs" variant="outline" onClick={() => openGenericWorkflowDialog(WorkOrderStatus.QUOTING, "Acknowledge & Re-Quote", "Return this work order to the Quoting stage.")}>Acknowledge &amp; Re-Quote</Button>
                            <Button size="xs" variant="outline" onClick={() => openScheduleWorkDialog()}>Acknowledge &amp; Re-Schedule</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
      
        <Card className="shadow-lg w-full mt-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center"><MessageCircleMore className="mr-2 h-5 w-5 text-primary"/>Activity Log</CardTitle>
                <CardDescription className="text-xs">A log of all notes, feedback, and communications for this ticket.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 border rounded-md p-3 bg-muted/30 mb-4">
                    {combinedActivityLog.length > 0 ? (
                        combinedActivityLog.map((log, index) => (
                            <div key={index} className={cn("mb-3 p-2 rounded-md text-xs", (log.author === user?.displayName || log.author === user?.email) ? "bg-primary/10 ml-auto max-w-[85%]" : "bg-secondary/30 mr-auto max-w-[85%]")}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-semibold text-foreground/90 flex items-center">
                                        <Avatar className="h-4 w-4 mr-1.5"><AvatarFallback className="text-[8px]">{getInitials(log.author)}</AvatarFallback></Avatar>
                                        {log.author} {(log.author === user?.displayName || log.author === user?.email) && "(You)"}
                                        <span className="text-muted-foreground/80 font-normal ml-2">({log.type})</span>
                                    </span>
                                    <span className="text-muted-foreground/80">{format(log.timestamp, "PP p")}</span>
                                </div>
                                <p className="text-foreground/80 whitespace-pre-wrap">{log.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No activity yet.</p>
                    )}
                </ScrollArea>
                
                {!isTerminalStatus && !isResolvedStatus && (
                    <div className="space-y-2">
                        <Label htmlFor="activityInput">New Log Entry:</Label>
                        <Textarea id="activityInput" value={newActivityMessage} onChange={(e) => setNewActivityMessage(e.target.value)} placeholder="Type your message, note, or update..." disabled={isSubmittingActivity} className="min-h-[80px]"/>
                        <div className="flex justify-end gap-2 flex-wrap">
                            {isManager ? (
                                <>
                                    <Button onClick={() => handleActivitySubmit('Internal Note')} disabled={isSubmittingActivity || !newActivityMessage.trim()} size="sm" variant="outline">
                                        {isSubmittingActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <StickyNote className="mr-2 h-4 w-4"/>Save as Internal Note
                                    </Button>
                                    <Button onClick={() => handleActivitySubmit('Manager Communication')} disabled={isSubmittingActivity || !newActivityMessage.trim()} size="sm" variant="outline">
                                        {isSubmittingActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Mail className="mr-2 h-4 w-4"/>Send to User
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => handleActivitySubmit('User Feedback')} disabled={isSubmittingActivity || !newActivityMessage.trim()} size="sm">
                                    {isSubmittingActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send Feedback
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>


       {isManager && (
        <div className="flex flex-wrap justify-end gap-3 mt-6">
            {workOrder.status !== WorkOrderStatus.CANCELLED && workOrder.status !== WorkOrderStatus.CLOSED && (
              <Button size="sm" variant="destructive" onClick={() => openGenericWorkflowDialog(WorkOrderStatus.CANCELLED, "Cancel Work Order", "Provide a reason for cancellation. This will be logged in notes.", { initialEmail: workOrder.createdByUserEmail, requiresResolutionNotes: true })} disabled={isTerminalStatus}>Cancel Order</Button>
            )}
            {workOrder.status !== WorkOrderStatus.RESOLVED && workOrder.status !== WorkOrderStatus.CLOSED && workOrder.status !== WorkOrderStatus.CANCELLED && (
              <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={openResolveDialog} disabled={isTerminalStatus || workOrder.status === WorkOrderStatus.RESOLVED || (workOrder.status === WorkOrderStatus.QUOTING && !(workOrder.quoteRequests?.some(qr => qr.status === QuoteRequestStatus.ACCEPTED)) && !workOrder.supplierId )}>Mark Resolved</Button>
            )}
            {(workOrder.status === WorkOrderStatus.RESOLVED && canReopen) && (
                <Button size="sm" variant="outline" onClick={openReopenDialog} className="text-orange-600 border-orange-500 hover:bg-orange-50 hover:text-orange-700">
                    <RotateCcw className="mr-2 h-4 w-4"/> Reopen Ticket
                </Button>
            )}
        </div>
      )}

      {workflowActionDialog && (
        <Dialog open={!!workflowActionDialog} onOpenChange={() => !isSubmittingWorkflowAction && setWorkflowActionDialog(null)}>
          <ShadDialogContent className="sm:max-w-lg">
            <ShadDialogHeader>
              <ShadDialogTitle>{workflowActionDialog.title}</ShadDialogTitle>
              {workflowActionDialog.description && <ShadDialogDescription>{workflowActionDialog.description}</ShadDialogDescription>}
            </ShadDialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              {workflowActionDialog.suppliersToRequestQuote && (
                <div>
                  <Label>Select Suppliers for Quote Request</Label>
                  <ScrollArea className="h-40 mt-1 border rounded-md p-2">
                    {isLoadingSuppliers && <p className="text-xs text-muted-foreground">Loading suppliers...</p>}
                    {!isLoadingSuppliers && workflowActionDialog.suppliersToRequestQuote.length === 0 && <p className="text-xs text-muted-foreground">No suppliers available.</p>}
                    {workflowActionDialog.suppliersToRequestQuote.map(supplier => (
                      <div key={supplier.id} className="flex items-center space-x-2 mb-1.5">
                        <Checkbox id={`supplier-quote-${supplier.id}`}
                          checked={workflowActionDialog.selectedSupplierIdsForQuote?.has(supplier.id)}
                          onCheckedChange={(checked) => setWorkflowActionDialog(prev => {
                            if (!prev || !prev.selectedSupplierIdsForQuote) return prev;
                            const newSet = new Set(prev.selectedSupplierIdsForQuote);
                            if (checked) newSet.add(supplier.id); else newSet.delete(supplier.id);
                            return { ...prev, selectedSupplierIdsForQuote: newSet };
                          })} disabled={isSubmittingWorkflowAction}/>
                        <Label htmlFor={`supplier-quote-${supplier.id}`} className="text-sm font-normal">{supplier.name} <span className="text-xs text-muted-foreground">({supplier.specialties?.join(', ') || 'General'})</span></Label>
                      </div>))}
                  </ScrollArea>
                </div>
              )}
              {workflowActionDialog.targetStatus === WorkOrderStatus.QUOTING && workflowActionDialog.selectedSupplierIdForEngagement !== undefined && !workflowActionDialog.suppliersToRequestQuote && (
                <>
                 <div>
                    <Label htmlFor="workflowEngageSupplierSelect">Supplier to Engage</Label>
                    <Select value={workflowActionDialog.selectedSupplierIdForEngagement || NO_SUPPLIER_SELECTED_VALUE} onValueChange={(val) => setWorkflowActionDialog(prev => prev ? {...prev, selectedSupplierIdForEngagement: val === NO_SUPPLIER_SELECTED_VALUE ? null : val} : null)} disabled={isLoadingSuppliers || isSubmittingWorkflowAction}>
                        <SelectTrigger id="workflowEngageSupplierSelect"><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                        <SelectContent><SelectItem value={NO_SUPPLIER_SELECTED_VALUE}>None</SelectItem>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="workflowEstimatedCost">Estimated Cost (£) (Optional)</Label>
                    <Input id="workflowEstimatedCost" type="number" step="0.01" placeholder="0.00" value={workflowActionDialog.estimatedCostForEngagement ?? ''} onChange={(e) => setWorkflowActionDialog(prev => prev ? { ...prev, estimatedCostForEngagement: e.target.value === '' ? null : parseFloat(e.target.value)} : null)} disabled={isSubmittingWorkflowAction} />
                 </div>
                </>
              )}
             
              {(workflowActionDialog.finalCostForResolution !== undefined || workflowActionDialog.requiresCostForResolution) && (
                 <div>
                    <Label htmlFor="workflowFinalCost">Final Cost (£) {workflowActionDialog.requiresCostForResolution && <span className="text-destructive">*</span>}</Label>
                    <Input id="workflowFinalCost" type="number" step="0.01" placeholder="0.00" value={workflowActionDialog.finalCostForResolution ?? ''} onChange={(e) => setWorkflowActionDialog(prev => prev ? { ...prev, finalCostForResolution: e.target.value === '' ? null : parseFloat(e.target.value)} : null)} disabled={isSubmittingWorkflowAction} />
                 </div>
              )}
              {(workflowActionDialog.forcedResolutionNotes !== undefined || workflowActionDialog.requiresResolutionNotesForResolution) && (
                 <div><Label htmlFor="workflowForcedResolutionNotes">{workflowActionDialog.targetStatus === WorkOrderStatus.CANCELLED ? "Cancellation" : "Resolution"} Notes { (workflowActionDialog.forcedResolutionNotes !== undefined || workflowActionDialog.requiresResolutionNotesForResolution) && <span className="text-destructive">*</span>}</Label><Textarea id="workflowForcedResolutionNotes" value={newActivityMessage} onChange={(e) => setNewActivityMessage(e.target.value)} placeholder="Provide notes..." disabled={isSubmittingWorkflowAction}/></div>
              )}
               {workflowActionDialog.email !== undefined && workflowActionDialog.targetStatus === WorkOrderStatus.AWAITING_USER_FEEDBACK && (
                <div><Label htmlFor="workflowEmail">Message to {workflowActionDialog.email}:</Label><Textarea id="workflowEmail" value={newActivityMessage} onChange={(e) => setNewActivityMessage(e.target.value)} placeholder="Your message..." disabled={isSubmittingWorkflowAction}/></div>
              )}
              {workflowActionDialog.reopenAction !== undefined && (
                <div className="space-y-2">
                    <Label>Reopen Action:</Label>
                    <Select value={workflowActionDialog.reopenAction} onValueChange={(val) => setWorkflowActionDialog(prev => prev ? {...prev, reopenAction: val as 'reschedule' | 'retriage'} : null)} disabled={isSubmittingWorkflowAction}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="retriage">Return to Triage</SelectItem>
                            <SelectItem value="reschedule" disabled>Reschedule with Current Supplier</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              )}
            </div>
            <ShadDialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingWorkflowAction}>Cancel</Button></DialogClose>
              <Button type="button" onClick={handleConfirmWorkflowAction} disabled={isSubmittingWorkflowAction || (workflowActionDialog.targetStatus === WorkOrderStatus.QUOTING && workflowActionDialog.suppliersToRequestQuote && (!workflowActionDialog.selectedSupplierIdsForQuote || workflowActionDialog.selectedSupplierIdsForQuote.size === 0)) || (workflowActionDialog.requiresCostForResolution && (workflowActionDialog.finalCostForResolution === null || workflowActionDialog.finalCostForResolution === undefined || workflowActionDialog.finalCostForResolution < 0)) || (workflowActionDialog.targetStatus === WorkOrderStatus.CANCELLED && workflowActionDialog.forcedResolutionNotes !== undefined && !newActivityMessage.trim()) || (workflowActionDialog.targetStatus === WorkOrderStatus.RESOLVED && workflowActionDialog.requiresResolutionNotesForResolution && !newActivityMessage.trim()) }>{isSubmittingWorkflowAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm</Button>
            </ShadDialogFooter>
          </ShadDialogContent>
        </Dialog>
      )}

      {isScheduleWorkDialogOpen && workOrder && (
        <ScheduleWorkDialog
            isOpen={isScheduleWorkDialogOpen}
            onOpenChange={setIsScheduleWorkDialogOpen}
            workOrder={workOrder}
            suppliers={suppliers}
            initialData={scheduleDialogInitialData}
            onWorkOrderScheduled={fetchWorkOrderData}
        />
      )}

      {quoteToEdit && (
        <EditQuoteDialog
          isOpen={isEditQuoteDialogOpen}
          onOpenChange={(open) => {
            setIsEditQuoteDialogOpen(open);
            if (!open) setPendingStatusForDialog(null);
          }}
          quoteRequest={quoteToEdit}
          onQuoteUpdated={handleSaveQuoteFromDialog}
        />
      )}
    </div>
  );
}
