"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Power,
  PowerOff,
  Lock,
  Globe,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  XCircle,
  Wrench
} from "lucide-react";

interface MaintenanceModeProps {
  isMaintenanceMode?: boolean;
  onToggle?: (isEnabled: boolean) => void;
  setIsMaintenanceMode?: (isEnabled: boolean) => void;
}

export default function MaintenanceMode({ 
  isMaintenanceMode: propIsMaintenanceMode,
  onToggle 
}: MaintenanceModeProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    link: "",
    reason: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check maintenance status on mount
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    setCheckingStatus(true);
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/maintenance/status');
      if (!response.ok) throw new Error('Failed to check status');
      
      const data = await response.json();
      const isMaintenance = data.isMaintenanceMode || false;
      setIsMaintenanceMode(isMaintenance);
      */
      
      // Static implementation
      setTimeout(() => {
        setIsMaintenanceMode(false); // Default to live mode
        setCheckingStatus(false);
      }, 500);
      
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      toast.error('Failed to check maintenance status');
      setCheckingStatus(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ link: "", reason: "", password: "" });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({ link: "", reason: "", password: "" });
  };

  const handleTurnOffWebsite = async () => {
    if (!formData.password.trim()) {
      toast.error('Password is required');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setLoading(true);

    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/maintenance/off', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          link: formData.link,
          reason: formData.reason,
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to enable maintenance mode');
      */
      
      // Static implementation
      setTimeout(() => {
        setIsMaintenanceMode(true);
        onToggle?.(true);
        toast.success('Maintenance mode enabled successfully! (static mode)');
        setDialogOpen(false);
        setLoading(false);
        
        // TODO: Add notification
        /*
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: "Site is now down for maintenance",
            description: "Maintenance mode enabled",
            status: "unread",
            userId: user?._id
          }),
        });
        */
      }, 1000);
      
    } catch (error) {
      console.error('Error enabling maintenance mode:', error);
      toast.error('Failed to enable maintenance mode');
      setLoading(false);
    }
  };

  const handleTurnOnWebsite = async () => {
    if (!formData.password.trim()) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);

    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/maintenance/on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      if (!response.ok) throw new Error('Failed to disable maintenance mode');
      */
      
      // Static implementation
      setTimeout(() => {
        setIsMaintenanceMode(false);
        onToggle?.(false);
        toast.success('Maintenance mode disabled successfully! (static mode)');
        setDialogOpen(false);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error disabling maintenance mode:', error);
      toast.error('Failed to disable maintenance mode');
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={isMaintenanceMode ? "border-red-200 bg-red-50" : "border-green-200 bg-blue-200"}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isMaintenanceMode ? "bg-red-100 text-red-600" : "bg-blue-200 text-green-600"}`}>
                {isMaintenanceMode ? (
                  <PowerOff className="h-6 w-6" />
                ) : (
                  <Power className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {isMaintenanceMode ? "Maintenance Mode Active" : "Website is Live"}
                </h3>
                <p className="text-gray-600">
                  {isMaintenanceMode 
                    ? "Your website is currently offline for maintenance"
                    : "Your website is live and accessible to users"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {checkingStatus ? (
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isMaintenanceMode ? (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Online</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Control
          </CardTitle>
          <CardDescription>
            Take your website offline for maintenance or bring it back online
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert variant={isMaintenanceMode ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {isMaintenanceMode
                ? "Your website is currently offline. Users cannot access it until you bring it back online."
                : "Taking your website offline will make it inaccessible to all users. Use this only for maintenance."
              }
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleOpenDialog}
              size="lg"
              variant={isMaintenanceMode ? "default" : "destructive"}
              className={`flex-1 ${isMaintenanceMode ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              disabled={checkingStatus || loading}
            >
              {isMaintenanceMode ? (
                <>
                  <Power className="h-5 w-5 mr-2" />
                  Turn Website Back On
                </>
              ) : (
                <>
                  <PowerOff className="h-5 w-5 mr-2" />
                  Close Website Temporarily
                </>
              )}
            </Button>
            
            <Button
              onClick={checkMaintenanceStatus}
              variant="outline"
              size="lg"
              disabled={checkingStatus || loading}
              className="flex-1 border-blue-500 text-blue-400 hover:bg-blue-200 hover:text-white"
            >
              <Power className="h-5 w-5 mr-2" />
              Check Status
            </Button>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Important Notes
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                Maintenance mode displays a user-friendly message to visitors
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                Search engines will be notified that your site is temporarily unavailable
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                You can provide an optional link for users to visit while maintenance is ongoing
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                Admin users will still be able to access the site during maintenance
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isMaintenanceMode ? "Turn Website Back On" : "Close Website Temporarily"}
            </DialogTitle>
            <DialogDescription>
              {isMaintenanceMode
                ? "Bring your website back online for users"
                : "Take your website offline for maintenance"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                {isMaintenanceMode
                  ? "Users will be able to access the website immediately after you turn it back on."
                  : "Users will no longer be able to access the website until you turn it back on."
                }
              </AlertDescription>
            </Alert>

            {!isMaintenanceMode ? (
              <>
                {/* Turn Off Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Optional Link
                    </Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) => handleInputChange('link', e.target.value)}
                      placeholder="https://example.com/status"
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Provide a link for users to visit while maintenance is ongoing
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Reason for Maintenance <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Describe why the website is going offline..."
                      rows={3}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Administrator Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password to confirm"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Required for security verification
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={isMaintenanceMode ? handleTurnOnWebsite : handleTurnOffWebsite}
              disabled={loading || (isMaintenanceMode ? !formData.password : !formData.password || !formData.reason)}
              className={isMaintenanceMode ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : isMaintenanceMode ? (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Turn Website Back On
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Take Website Offline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}