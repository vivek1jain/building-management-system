import { CreateWorkOrderForm } from '@/components/work-orders/CreateWorkOrderForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewWorkOrderPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create New Ticket</CardTitle>
          <CardDescription>Fill in the details below to submit a new ticket.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
