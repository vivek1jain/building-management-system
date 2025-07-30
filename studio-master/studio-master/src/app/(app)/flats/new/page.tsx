import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateFlatForm } from '@/components/flats/CreateFlatForm';

export default function NewFlatPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add New Flat/Unit</CardTitle>
          <CardDescription>Fill in the details below to add a new flat or unit.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateFlatForm />
        </CardContent>
      </Card>
    </div>
  );
}
