import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle2 } from 'lucide-react'; // Added UserCircle2

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center">
            <UserCircle2 className="mr-3 h-8 w-8 text-primary" /> {/* Added Icon */}
            My Profile
            </CardTitle>
          <CardDescription>View and update your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
