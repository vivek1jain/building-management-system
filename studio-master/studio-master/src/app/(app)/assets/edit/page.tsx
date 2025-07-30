
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAssetById, type Asset } from '@/lib/firebase/firestore';
import { EditAssetForm } from '@/components/assets/EditAssetForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const assetId = typeof params.id === 'string' ? params.id : undefined;

  const [asset, setAsset] = React.useState<Asset | null>(null);
  const [isLoadingAsset, setIsLoadingAsset] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!assetId) {
      setError("No asset ID provided.");
      setIsLoadingAsset(false);
      return;
    }
    if (authLoading) return;

    if (!user) {
        toast({ title: "Unauthorized", description: "Please log in to edit assets.", variant: "destructive"});
        router.replace('/login');
        return;
    }

    const fetchAsset = async () => {
      setIsLoadingAsset(true);
      setError(null);
      try {
        const fetchedAsset = await getAssetById(assetId);
        if (fetchedAsset) {
          setAsset(fetchedAsset);
        } else {
          setError("Asset not found.");
          toast({ title: "Error", description: "Asset not found.", variant: "destructive"});
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch asset details.");
        toast({ title: "Error", description: err.message || "Could not load asset details.", variant: "destructive"});
      } finally {
        setIsLoadingAsset(false);
      }
    };

    fetchAsset();
  }, [assetId, authLoading, user, router, toast]);

  if (isLoadingAsset || authLoading) {
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
          <Link href="/building?tab=assets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Link>
        </Button>
        <Card className="shadow-lg max-w-md mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/building?tab=assets')} className="mt-4">Go to Assets List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!asset) {
    // Should be caught by error state, but as a fallback
    return <p className="text-center text-muted-foreground">Asset could not be loaded.</p>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/building?tab=assets">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Link>
      </Button>
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Asset</CardTitle>
          <CardDescription>Update the details for &quot;{asset.name}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditAssetForm asset={asset} />
        </CardContent>
      </Card>
    </div>
  );
}
