
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getFlatById, type Flat } from '@/lib/firebase/firestore';
import { EditFlatForm } from '@/components/flats/EditFlatForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function EditFlatPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const flatId = typeof params.id === 'string' ? params.id : undefined;

  const [flat, setFlat] = React.useState<Flat | null>(null);
  const [isLoadingFlat, setIsLoadingFlat] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!flatId) {
      setError("No flat/unit ID provided.");
      setIsLoadingFlat(false);
      return;
    }
    if (authLoading) return;

    if (!user) {
        // This case should not be hit in auth-free mode
        toast({ title: "Error", description: "User context not available.", variant: "destructive"});
        return;
    }

    const fetchFlat = async () => {
      setIsLoadingFlat(true);
      setError(null);
      try {
        const fetchedFlat = await getFlatById(flatId);
        if (fetchedFlat) {
          setFlat(fetchedFlat);
        } else {
          setError("Flat/Unit not found.");
          toast({ title: "Error", description: "Flat/Unit not found.", variant: "destructive"});
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch flat/unit details.");
        toast({ title: "Error", description: err.message || "Could not load flat/unit details.", variant: "destructive"});
      } finally {
        setIsLoadingFlat(false);
      }
    };

    fetchFlat();
  }, [flatId, authLoading, user, toast]);

  if (isLoadingFlat || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-36 mb-6" />
        <Card className="shadow-lg max-w-xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 text-center">
         <Button variant="outline" asChild className="mb-6 mr-auto">
          <Link href="/building?tab=flats">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flats/Units
          </Link>
        </Button>
        <Card className="shadow-lg max-w-md mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Flat/Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/building?tab=flats')} className="mt-4">Go to Flats/Units List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!flat) {
    return <p className="text-center text-muted-foreground">Flat/Unit could not be loaded.</p>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/building?tab=flats">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Flats/Units
        </Link>
      </Button>
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Flat/Unit</CardTitle>
          <CardDescription>Update the details for &quot;{flat.flatNumber}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditFlatForm flat={flat} />
        </CardContent>
      </Card>
    </div>
  );
}
