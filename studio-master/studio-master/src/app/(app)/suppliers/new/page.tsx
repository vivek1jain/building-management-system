import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSupplierForm } from '@/components/suppliers/CreateSupplierForm';

export default function NewSupplierPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add New Supplier</CardTitle>
          <CardDescription>Fill in the details below to add a new supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSupplierForm />
        </CardContent>
      </Card>
    </div>
  );
}
