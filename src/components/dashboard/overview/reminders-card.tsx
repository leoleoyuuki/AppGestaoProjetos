import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RemindersCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-primary/10 p-4 rounded-lg">
            <h4 className="font-semibold text-primary">Meeting with Arc Company</h4>
            <p className="text-sm text-muted-foreground mb-4">Time: 02.00 pm - 04.00 pm</p>
            <Button className="w-full">Start Meeting</Button>
        </div>
      </CardContent>
    </Card>
  );
}
