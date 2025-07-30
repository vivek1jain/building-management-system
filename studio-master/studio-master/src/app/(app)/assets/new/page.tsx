import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateAssetForm } from '@/components/assets/CreateAssetForm';

export default function NewAssetPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add New Asset</CardTitle>
          <CardDescription>Fill in the details below to add a new asset.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAssetForm />
        </CardContent>
      </Card>
    </div>
  );
}
