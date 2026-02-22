import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pause, Square } from 'lucide-react';

export default function TimeTrackerCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Time Tracker</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="text-5xl font-bold font-mono tracking-tighter mb-4">
            01:24:08
        </div>
        <div className="flex gap-4">
            <Button size="icon" className="rounded-full h-14 w-14">
                <Pause className="h-6 w-6" />
            </Button>
            <Button variant="destructive" size="icon" className="rounded-full h-14 w-14">
                <Square className="h-6 w-6 fill-white" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
