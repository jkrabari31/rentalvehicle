import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { invokeIPC } from '@/lib/ipc';
import { Activity, Car, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const { } = useAppStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await invokeIPC<any>('get-dashboard-stats');
    setStats(data);
  };

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your rental business</p>
        </div>
        <div className="text-sm text-muted-foreground bg-white dark:bg-slate-900 border rounded-lg px-4 py-2">
          <Clock className="w-4 h-4 inline mr-2" />
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950 dark:to-amber-900/40 border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300">Active Rentals</CardTitle>
            <div className="p-2.5 bg-amber-500/15 rounded-xl">
              <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-950 dark:text-amber-50">{stats.onRentVehicles}</div>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-2 font-medium">
              Vehicles currently on rent
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950 dark:to-emerald-900/40 border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Available Vehicles</CardTitle>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl">
              <Car className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">{stats.availableVehicles} <span className="text-lg font-normal text-emerald-700/70 dark:text-emerald-400/70">/ {stats.totalVehicles}</span></div>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-2 font-medium">
              Ready for rental
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="mt-4">
        {/* Active Rentals Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Active Rentals</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Vehicles currently on rent</p>
            </div>
            <Activity className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            {stats.activeRentals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.activeRentals.map((rental: any) => (
                    <TableRow key={rental.id}>
                      <TableCell className="font-medium">{rental.customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{rental.vehicle.vehicleName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(rental.pickupDate), 'MMM d, h:mm a')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No active rentals at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
