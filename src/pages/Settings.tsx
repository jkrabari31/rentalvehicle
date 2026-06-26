import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { invokeIPC } from '@/lib/ipc';
import { useAppStore } from '@/store';
import { Save, Database, FolderOpen, Lock, Trash2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isTruncateDialogOpen, setIsTruncateDialogOpen] = useState(false);
  const [truncatePassword, setTruncatePassword] = useState('');
  const [truncateError, setTruncateError] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState(false);
  const { setCurrencySymbol } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await invokeIPC<any>('get-settings');
    setSettings(data);
    if (data?.currencySymbol) {
      setCurrencySymbol(data.currencySymbol);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await invokeIPC('update-settings', settings);
    setCurrencySymbol(settings.currencySymbol);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleBackup = async () => {
    await invokeIPC('backup-database');
  };

  const handleRestore = async () => {
    await invokeIPC('restore-database');
  };

  const handleTruncate = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassword = settings.settingsPassword || '06062026';
    if (truncatePassword === currentPassword) {
      await invokeIPC('truncate-completed-rentals');
      setIsTruncateDialogOpen(false);
      setTruncatePassword('');
      setTruncateError(false);
      alert('Completed rentals have been successfully truncated.');
    } else {
      setTruncateError(true);
    }
  };

  const handleFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassword = settings.settingsPassword || '06062026';
    if (resetPassword === currentPassword) {
      const result = await invokeIPC<{success: boolean, error?: string}>('factory-reset');
      if (result && result.success) {
        setIsResetDialogOpen(false);
        setResetPassword('');
        setResetError(false);
      } else {
        alert('Factory reset failed: ' + (result?.error || 'Unknown error'));
      }
    } else {
      setResetError(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassword = settings.settingsPassword || '06062026';
    if (passwordInput === currentPassword) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (!settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-muted-foreground">Loading settings...</div>
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
          <CardDescription>Enter the administrator password to access settings</CardDescription>
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
            <Button type="submit" className="w-full text-md h-11">Unlock Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your application preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Rental Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Rental Settings</CardTitle>
            <CardDescription>Configure currency and calculation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Select 
                  value={settings.currencySymbol || '₹'} 
                  onValueChange={(val) => setSettings({ ...settings, currencySymbol: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="₹">₹ (Rupee)</SelectItem>
                    <SelectItem value="$">$ (Dollar)</SelectItem>
                    <SelectItem value="£">£ (Pound)</SelectItem>
                    <SelectItem value="€">€ (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hourly Rounding Rule</Label>
                <Select 
                  value={settings.hourlyRoundingRule} 
                  onValueChange={(val) => setSettings({ ...settings, hourlyRoundingRule: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXACT">Exact (Minute by Minute)</SelectItem>
                    <SelectItem value="ROUND_UP">Round Up to Next Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDeposit">Default Deposit Amount</Label>
              <Input 
                id="defaultDeposit" 
                type="number"
                value={settings.defaultDepositAmount || 0}
                onChange={(e) => setSettings({ ...settings, defaultDepositAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Details that will appear on receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={settings.companyName || ''}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyContact">Contact Number</Label>
                <Input 
                  id="companyContact" 
                  value={settings.companyContact || ''}
                  onChange={(e) => setSettings({ ...settings, companyContact: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input 
                id="companyAddress" 
                value={settings.companyAddress || ''}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptFooterText">Receipt Footer Text</Label>
              <Input 
                id="receiptFooterText" 
                value={settings.receiptFooterText || ''}
                onChange={(e) => setSettings({ ...settings, receiptFooterText: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-red-100 dark:border-red-900/30">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <Lock className="w-4 h-4 mr-2" /> Security
            </CardTitle>
            <CardDescription>Update the master password for the settings page</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="settingsPassword">Settings Master Password</Label>
              <Input 
                id="settingsPassword" 
                type="text"
                value={settings.settingsPassword || ''}
                onChange={(e) => setSettings({ ...settings, settingsPassword: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center space-x-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          {saveStatus && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in">{saveStatus}</span>
          )}
        </div>
      </form>

      {/* Database Backup/Restore */}
      <Card className="max-w-2xl border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-600" />
            <span>Database Management</span>
          </CardTitle>
          <CardDescription>Backup and restore your application data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleBackup} className="flex-1">
              <FolderOpen className="w-4 h-4 mr-2" />
              Backup Database
            </Button>
            <Button variant="outline" onClick={handleRestore} className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950">
              <Database className="w-4 h-4 mr-2" />
              Restore Database
            </Button>
          </div>
          <div className="mt-8 border-t pt-6 border-red-200 dark:border-red-900/50">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Danger Zone
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all COMPLETED rentals to free up space. Active rentals, vehicles, and customers will not be affected.
            </p>
            <Button variant="destructive" onClick={() => setIsTruncateDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Master Truncate Data
            </Button>
          </div>
          <div className="mt-6 border-t pt-6 border-amber-900/30 dark:border-amber-900/50">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-2 flex items-center">
              <RefreshCcw className="w-4 h-4 mr-1.5" /> Factory Reset
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Wipe all database records (vehicles, rentals, maintenance, customers) and restore the application to a completely fresh, empty state. Your settings will also be reset.
            </p>
            <Button onClick={() => setIsResetDialogOpen(true)} className="bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-700 border-none">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reset Application to Defaults
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">⚠️ Restoring a backup or resetting will replace all current data. Make sure to backup first.</p>
        </CardContent>
      </Card>

      <Dialog open={isTruncateDialogOpen} onOpenChange={setIsTruncateDialogOpen}>
        <DialogContent className="border-red-200 dark:border-red-900 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Confirm Master Truncate
            </DialogTitle>
            <DialogDescription className="text-base pt-2 font-medium">
              Are you absolutely sure? This action cannot be undone. All completed rental records will be permanently erased.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTruncate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Enter Master Password to confirm</Label>
              <Input 
                type="password" 
                value={truncatePassword} 
                onChange={(e) => setTruncatePassword(e.target.value)} 
                required 
                autoFocus
              />
              {truncateError && <p className="text-sm text-red-500 font-medium">Incorrect password</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsTruncateDialogOpen(false); setTruncatePassword(''); setTruncateError(false); }}>Cancel</Button>
              <Button type="submit" variant="destructive">Yes, Truncate Data</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="border-amber-700 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-700 dark:text-amber-500 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Confirm Factory Reset
            </DialogTitle>
            <DialogDescription className="text-base pt-2 font-medium">
              Are you absolutely sure? This will PERMANENTLY ERASE all vehicles, rentals, customers, and maintenance records. The app will restart automatically after reset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFactoryReset} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Enter Master Password to confirm</Label>
              <Input 
                type="password" 
                value={resetPassword} 
                onChange={(e) => setResetPassword(e.target.value)} 
                required 
                autoFocus
              />
              {resetError && <p className="text-sm text-red-500 font-medium">Incorrect password</p>}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsResetDialogOpen(false); setResetPassword(''); setResetError(false); }}>Cancel</Button>
              <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white">Yes, Factory Reset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
