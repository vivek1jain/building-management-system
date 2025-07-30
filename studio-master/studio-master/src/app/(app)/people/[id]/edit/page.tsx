
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getPersonById, type Person } from '@/lib/firebase/firestore';
import { EditPersonForm } from '@/components/people/EditPersonForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const personId = typeof params.id === 'string' ? params.id : undefined;

  const [person, setPerson] = React.useState<Person | null>(null);
  const [isLoadingPerson, setIsLoadingPerson] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!personId) {
      setError("No person ID provided.");
      setIsLoadingPerson(false);
      return;
    }
    if (authLoading) return;

    if (!user) {
        // This case should not be hit in auth-free mode
        toast({ title: "Error", description: "User context not available.", variant: "destructive"});
        return;
    }

    const fetchPerson = async () => {
      setIsLoadingPerson(true);
      setError(null);
      try {
        const fetchedPerson = await getPersonById(personId);
        if (fetchedPerson) {
          setPerson(fetchedPerson);
        } else {
          setError("Person not found.");
          toast({ title: "Error", description: "Person not found.", variant: "destructive"});
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch person details.");
        toast({ title: "Error", description: err.message || "Could not load person details.", variant: "destructive"});
      } finally {
        setIsLoadingPerson(false);
      }
    };

    fetchPerson();
  }, [personId, authLoading, user, toast]);

  if (isLoadingPerson || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-36 mb-6" />
        <Card className="shadow-lg max-w-xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
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
          <Link href="/building?tab=people">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Link>
        </Button>
        <Card className="shadow-lg max-w-md mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/building?tab=people')} className="mt-4">Go to People List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!person) {
    return <p className="text-center text-muted-foreground">Person could not be loaded.</p>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/building?tab=people">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Link>
      </Button>
      <Card className="shadow-lg max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Person</CardTitle>
          <CardDescription>Update the details for &quot;{person.name}&quot;.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditPersonForm person={person} />
        </CardContent>
      </Card>
    </div>
  );
}
