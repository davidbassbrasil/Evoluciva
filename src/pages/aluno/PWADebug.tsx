import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PWADebug() {
  const [status, setStatus] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const checkStatus = async () => {
    const newStatus: any = {};
    
    // 1. Check HTTPS
    newStatus.https = window.location.protocol === 'https:';
    addLog(`Protocol: ${window.location.protocol}`);

    // 2. Check Service Worker Support
    newStatus.swSupport = 'serviceWorker' in navigator;
    addLog(`SW Support: ${newStatus.swSupport}`);

    // 3. Check Registered SW
    if (newStatus.swSupport) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        newStatus.registrations = regs.map(r => ({
          scope: r.scope,
          active: !!r.active,
          installing: !!r.installing,
          waiting: !!r.waiting
        }));
        addLog(`Registrations found: ${regs.length}`);
      } catch (e) {
        addLog(`Error checking regs: ${e}`);
      }
    }

    // 4. Check Manifest
    try {
      const resp = await fetch('/manifest.json');
      newStatus.manifestStatus = resp.status;
      if (resp.ok) {
        const json = await resp.json();
        newStatus.manifest = json;
        addLog('Manifest loaded successfully');
      } else {
        addLog(`Manifest failed: ${resp.status}`);
      }
    } catch (e) {
      newStatus.manifestError = String(e);
      addLog(`Manifest fetch error: ${e}`);
    }

    // 5. Check Standalone
    newStatus.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    addLog(`Standalone mode: ${newStatus.isStandalone}`);

    // 6. Check User Agent
    newStatus.userAgent = navigator.userAgent;

    // 7. Check Icons
    try {
      const iconResp = await fetch('/icon-192.png');
      newStatus.icon192 = iconResp.ok;
      addLog(`Icon 192 status: ${iconResp.status}`);
      
      const icon512Resp = await fetch('/icon-512.png');
      newStatus.icon512 = icon512Resp.ok;
      addLog(`Icon 512 status: ${icon512Resp.status}`);
    } catch (e) {
      addLog(`Icon check failed: ${e}`);
    }
    
    setStatus(newStatus);
  };

  useEffect(() => {
    checkStatus();
    
    // Listen for beforeinstallprompt
    const handlePrompt = (e: any) => {
      e.preventDefault();
      addLog('✅ beforeinstallprompt event fired!');
      setStatus((prev: any) => ({ ...prev, promptEvent: true }));
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">PWA Debugger</h1>
      
      <div className="grid gap-4">
        {/* HTTPS Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {status.https ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
              HTTPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{status.https ? 'Secure context active' : 'PWA requires HTTPS!'}</p>
          </CardContent>
        </Card>

        {/* Service Worker */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {status.registrations?.length > 0 ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-yellow-500" />}
              Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.registrations?.map((reg: any, i: number) => (
              <div key={i} className="text-sm bg-muted p-2 rounded mb-2">
                <p>Scope: {reg.scope}</p>
                <p>Active: {reg.active ? 'Yes' : 'No'}</p>
              </div>
            ))}
            {(!status.registrations || status.registrations.length === 0) && (
              <Button 
                onClick={() => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(() => {
                      addLog('Manual registration success');
                      checkStatus();
                    })
                    .catch(e => addLog(`Manual registration failed: ${e}`));
                }}
              >
                Try Register Manual
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Manifest */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {status.manifest ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
              Manifest & Icons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.manifest ? (
              <div className="space-y-2">
                <div className="flex gap-2 text-sm">
                  <span className={status.icon192 ? "text-green-500" : "text-red-500"}>
                    Icon 192: {status.icon192 ? "OK" : "Missing"}
                  </span>
                  <span className={status.icon512 ? "text-green-500" : "text-red-500"}>
                    Icon 512: {status.icon512 ? "OK" : "Missing"}
                  </span>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(status.manifest, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-500">Not loaded (Status: {status.manifestStatus})</p>
            )}
          </CardContent>
        </Card>

        {/* Install Prompt Event */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {status.promptEvent ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-yellow-500" />}
              Install Prompt Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{status.promptEvent ? 'Event fired and captured!' : 'Waiting for event...'}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: This event only fires on Android/Chrome and only if criteria are met (not installed, user engagement, etc).
            </p>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded text-xs font-mono h-60 overflow-auto">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-green-900/30 pb-1">{log}</div>
              ))}
            </div>
            <Button className="mt-2 w-full" onClick={checkStatus}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
