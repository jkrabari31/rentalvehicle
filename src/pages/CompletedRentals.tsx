import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { invokeIPC } from '@/lib/ipc';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, FileDown, Search, Printer, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';

export function CompletedRentals() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return format(d, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(today);

  const { currencySymbol } = useAppStore();

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const data = await invokeIPC<any[]>('get-rentals', { 
      status: 'COMPLETED',
      returnDate: { gte: start.toISOString(), lte: end.toISOString() }
    });
    setRentals(data || []);
    
    if (!settings) {
      const loadedSettings = await invokeIPC<any>('get-settings');
      setSettingsPassword(loadedSettings?.settingsPassword || '06062026');
      setSettings(loadedSettings);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settingsPassword) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const filteredRentals = useMemo(() => {
    const s = search.toLowerCase();
    return rentals.filter(r => 
      r.customer.name.toLowerCase().includes(s) || 
      r.vehicle.vehicleName.toLowerCase().includes(s) ||
      String(r.id).includes(s)
    );
  }, [rentals, search]);

  const exportData = (formatType: 'excel' | 'csv') => {
    if (filteredRentals.length === 0) {
      alert('No data to export.');
      return;
    }

    const data = filteredRentals.map(r => ({
      'Rental ID': `RNT-${r.id}`,
      'Customer Name': r.customer.name,
      'Customer Mobile': r.customer.mobileNumber,
      'Vehicle': `${r.vehicle.vehicleName} (${r.vehicle.vehicleNumber})`,
      'Package': r.selectedPackage || 'HOURLY',
      'Pickup Date': format(new Date(r.pickupDate), 'PPp'),
      'Return Date': r.returnDate ? format(new Date(r.returnDate), 'PPp') : 'N/A',
      'Total Hours': (() => { const m = Math.round((r.totalHours || 0) * 60); return `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`; })(),
      'Base Rent': (Number(r.totalAmount || 0) - Number(r.settlementAmount || 0)),
      'Settlement': r.settlementAmount || 0,
      'Net Amount': r.totalAmount || 0,
      'Deposit': r.depositAmount || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Completed Rentals');

    const fileName = `Completed_Rentals_${format(new Date(), 'yyyy-MM-dd')}`;
    if (formatType === 'excel') {
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
    }
  };

  const printReceipt = (rental: any) => {
    const companyName = settings?.companyName || 'Vehicle Rental';
    const companyContact = settings?.companyContact ? `Contact: ${settings.companyContact}` : '';
    const companyAddress = settings?.companyAddress ? `<br/>${settings.companyAddress}` : '';
    const footerText = settings?.receiptFooterText || 'Thank you for your business!';

    const printContent = `
      <div style="max-width: 400px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">${companyName}</h1>
          <p style="margin: 5px 0 0; color: #555; font-size: 12px;">${companyContact}${companyAddress}</p>
          <div style="margin-top: 10px; font-size: 14px; font-weight: bold;">Receipt RNT-${rental.id}</div>
        </div>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Customer</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${rental.customer.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Mobile</td><td style="padding: 6px 0; text-align: right;">${rental.customer.mobileNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Vehicle</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${rental.vehicle.vehicleName}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Reg. No.</td><td style="padding: 6px 0; text-align: right;">${rental.vehicle.vehicleNumber}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 6px 0; color: #666;">Pickup</td><td style="padding: 6px 0; text-align: right;">${format(new Date(rental.pickupDate), 'PPp')}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Return</td><td style="padding: 6px 0; text-align: right;">${rental.returnDate ? format(new Date(rental.returnDate), 'PPp') : 'N/A'}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 6px 0; color: #666;">Total Hours</td><td style="padding: 6px 0; text-align: right;">${(() => { const m = Math.round((rental.totalHours || 0) * 60); return `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`; })()} (HH:MM)</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Package</td><td style="padding: 6px 0; text-align: right;">${rental.selectedPackage || 'HOURLY'}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Deposit</td><td style="padding: 6px 0; text-align: right;">${currencySymbol}${rental.depositAmount || 0}</td></tr>
          <tr style="border-top: 1px solid #eee;"><td style="padding: 6px 0; color: #666;">Base Rent & Overtime</td><td style="padding: 6px 0; text-align: right;">${currencySymbol}${(Number(rental.totalAmount || 0) - Number(rental.settlementAmount || 0)).toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Settlement Adjustments</td><td style="padding: 6px 0; text-align: right;">${Number(rental.settlementAmount) < 0 ? '-' : ''}${currencySymbol}${Math.abs(Number(rental.settlementAmount || 0)).toFixed(2)}</td></tr>
        </table>
        <div style="border-top: 2px solid #333; margin-top: 15px; padding-top: 15px; text-align: center;">
          <div style="font-size: 22px; font-weight: 700;">Total: ${currencySymbol}${Number(rental.totalAmount || 0).toFixed(2)}</div>
        </div>
        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">${footerText}</p>
      </div>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    if (iframe.contentDocument) {
      iframe.contentDocument.write(printContent);
      iframe.contentDocument.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  if (!settingsPassword) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center h-[70vh] animate-in fade-in zoom-in-95 duration-300">
      <Card className="w-[400px] border-slate-200 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Restricted Area</CardTitle>
          <CardDescription>Enter the administrator password to view completed rentals</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Enter password..."
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
                className="text-center text-lg tracking-widest"
              />
              {passwordError && <p className="text-sm text-red-500 text-center font-medium animate-in slide-in-from-top-1">Incorrect password</p>}
            </div>
            <Button type="submit" className="w-full text-md h-11">Unlock Access</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Completed Transactions</h1>
          <p className="text-muted-foreground mt-1">{filteredRentals.length} records found</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 mr-2">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[135px] h-9" />
            <span className="text-muted-foreground text-sm font-medium">to</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[135px] h-9" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="w-56 pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => exportData('excel')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
            <FileDown className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Rental ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRentals.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <TableCell className="font-mono font-medium text-blue-600 dark:text-blue-400">RNT-{r.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{r.customer.name}</div>
                  <div className="text-xs text-muted-foreground">{r.customer.mobileNumber}</div>
                </TableCell>
                <TableCell>
                  <div>{r.vehicle.vehicleName}</div>
                  <div className="text-xs text-muted-foreground">{r.vehicle.vehicleNumber}</div>
                </TableCell>
                <TableCell className="text-sm">{format(new Date(r.pickupDate), 'MMM d, h:mm a')}</TableCell>
                <TableCell className="text-sm">{r.returnDate ? format(new Date(r.returnDate), 'MMM d, h:mm a') : '—'}</TableCell>
                <TableCell>{(() => { const m = Math.round((r.totalHours || 0) * 60); return `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`; })()}</TableCell>
                <TableCell><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-semibold">{r.selectedPackage || 'HOURLY'}</span></TableCell>
                <TableCell>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">{currencySymbol}{Number(r.totalAmount || 0).toFixed(2)}</div>
                  {Number(r.settlementAmount) !== 0 && (
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">Includes {Number(r.settlementAmount) < 0 ? '-' : '+'}{currencySymbol}{Math.abs(Number(r.settlementAmount)).toFixed(2)} stl.</div>
                  )}
                  {Number(r.depositAmount) > 0 && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-500 whitespace-nowrap">Deposit: {currencySymbol}{r.depositAmount}</div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => printReceipt(r)}>
                    <Printer className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRentals.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No completed rentals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
