
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupplierById, type Supplier } from '@/lib/firebase/firestore';
import { EditSupplierForm } from '@/components/suppliers/EditSupplierForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const supplierId = typeof params.id === 'string' ? params.id : undefined;

  const [supplier, setSupplier] = React.useState<Supplier | null>(null);
  const [isLoadingSupplier, setIsLoadingSupplier] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!supplierId) {
      setError("No supplier ID provided.");
      setIsLoadingSupplier(false);
      return;
    }
    if (authLoading) return; // Wait for auth state to resolve

    if (!user) {
        // This case should not be hit in auth-free mode
        toast({ title: "Error", description: "User context not available.", variant: "destructive"});
        return;
    }

    const fetchSupplier = async () => {
      setIsLoadingSupplier(true);
      setError(null);
      try {
        const fetchedSupplier = await getSupplierById(supplierId);
        if (fetchedSupplier) {
          setSupplier(fetchedSupplier);
        } else {
          setError("Supplier not found.");
          toast({ title: "Error", description: "Supplier not found.", variant: "destructive"});
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch supplier details.");
        toast({ title: "Error", description: err.message || "Could not load supplier details.", variant: "destructive"});
      } finally {
        setIsLoadingSupplier(false);
      }
    };

    fetchSupplier();
  }, [supplierId, authLoading, user, toast]);

  if (isLoadingSupplier || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-36 mb-6" /> {/* Back button skeleton */}
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" /> {/* Title skeleton */}
            <Skeleton className="h-4 w-1/2" /> {/* Description skeleton */}
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" /> {/* Label skeleton */}
                <Skeleton className="h-10 w-full" /> {/* Input skeleton */}
              </div>
            ))}
            <Skeleton className="h-10 w-full mt-4" /> {/* Submit button skeleton */}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 text-center">
         <Button variant="outline" asChild className="mb-6 mr-auto">
          <Link href="/building?tab=suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Link>
        </Button>
        <Card className="shadow-lg max-w-md mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/building?tab=suppliers')} className="mt-4">Go to Suppliers List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    // Should be caught by error state, but as a fallback
    return <p className="text-center text-muted-foreground">Supplier could not be loaded.</p>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/building?tab=suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Link>
      </Button>
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Supplier</CardTitle>
          <CardDescription>Update the details for &quot;{supplier.name}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditSupplierForm supplier={supplier} />
        </CardContent>
      </Card>
    </div>
  );
}
