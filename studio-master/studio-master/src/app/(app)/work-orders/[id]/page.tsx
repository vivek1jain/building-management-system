import { WorkOrderDetailClient } from '@/components/work-orders/WorkOrderDetailClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ClipboardList } from 'lucide-react'; // Added ClipboardList
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WorkOrderDetailPageProps {
  params: { id: string };
}

export default function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const { id } = params;

  return (
    <div className="space-y-8">
       <Button variant="outline" asChild className="mb-6">
        <Link href="/work-orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Ticketing
        </Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center">
            <ClipboardList className="mr-3 h-8 w-8 text-primary" /> {/* Added Icon */}
            Ticket Details
            </CardTitle>
          <CardDescription>View and manage the details of this ticket. ID: {id.substring(0,8)}...</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkOrderDetailClient workOrderId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
