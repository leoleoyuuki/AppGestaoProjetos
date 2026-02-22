import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const teamMembers = [
    { name: "Alexandra Deff", task: "Github Project Repository", status: "Completed", avatar: "/avatars/01.png" },
    { name: "Edwin Adenike", task: "Integrate User Authentication System", status: "In Progress", avatar: "/avatars/02.png" },
    { name: "Isaac Oluwatemilorun", task: "Develop Search and Filter Functionality", status: "Pending", avatar: "/avatars/03.png" },
    { name: "David Oshodi", task: "Responsive Layout for Homepage", status: "In Progress", avatar: "/avatars/04.png" },
]

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  'In Progress': 'default',
  'Completed': 'secondary',
  'Pending': 'destructive',
};


export default function TeamCollaborationCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Collaboration</CardTitle>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Add Member</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {teamMembers.map(member => (
                 <div key={member.name} className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${member.name}`} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">Working on {member.task}</p>
                    </div>
                    <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
