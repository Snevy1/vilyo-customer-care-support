"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Users,
  Mail,
  Calendar,
  DollarSign,
  Shield
} from "lucide-react";

// Static data for migration
const staticSubscribers = [
  {
    id: "1",
    packageName: "Premium Package",
    customerEmail: "john.doe@example.com",
    createdAt: "2024-01-15T10:30:00Z",
    amount: "$167.00",
    status: "active",
    isDeleted: false
  },
  {
    id: "2",
    packageName: "Standard Package",
    customerEmail: "jane.smith@example.com",
    createdAt: "2024-01-14T14:20:00Z",
    amount: "$64.50",
    status: "active",
    isDeleted: false
  },
  {
    id: "3",
    packageName: "Gold Package",
    customerEmail: "bob.johnson@example.com",
    createdAt: "2024-01-13T09:15:00Z",
    amount: "$203.00",
    status: "cancelled",
    isDeleted: false
  },
  {
    id: "4",
    packageName: "Free Plan",
    customerEmail: "alice.williams@example.com",
    createdAt: "2024-01-12T16:45:00Z",
    amount: "$0.00",
    status: "active",
    isDeleted: false
  },
  {
    id: "5",
    packageName: "Premium Package",
    customerEmail: "charlie.brown@example.com",
    createdAt: "2024-01-11T11:10:00Z",
    amount: "$167.00",
    status: "pending",
    isDeleted: false
  },
];

export default function Payments() {
  const [open, setOpen] = useState(false);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const fetchAllSubscriber = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/subscribers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      
      const data = await response.json();
      
      // Filter out deleted records
      const filteredData = data.filter((subscriber: any) => !subscriber.isDeleted);
      setTableData(filteredData);
      */
      
      // Static implementation
      setTimeout(() => {
        setTableData(staticSubscribers);
        setIsLoading(false);
      }, 800);
      
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('An error occurred while getting subscribers. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubscriber();
  }, []);

  const showModal = (subscriberId: string) => {
    setSelectedSubscriberId(subscriberId);
    setOpen(true);
  };

  const handleUnsubscribe = async () => {
    if (!selectedSubscriberId) return;
    
    setIsUnsubscribing(true);
    
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch(`/api/subscribers/${selectedSubscriberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to unsubscribe');
      */
      
      // Static implementation
      setTimeout(() => {
        setTableData(prev => prev.filter(sub => sub.id !== selectedSubscriberId));
        toast.success('Subscriber unsubscribed successfully! (static mode)');
        setOpen(false);
        setSelectedSubscriberId(null);
        setIsUnsubscribing(false);
      }, 500);
      
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe. Please try again.');
      setIsUnsubscribing(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedSubscriberId(null);
  };

  const handleExport = () => {
    // TODO: Implement actual export logic
    const exportableData = tableData.map((subscriber) => ({
      Name: subscriber.packageName || 'N/A',
      Email: subscriber.customerEmail || 'N/A',
      'Date Subscribed': new Date(subscriber.createdAt).toLocaleString(),
      Amount: subscriber.amount || 'N/A',
      Status: subscriber.status || 'N/A',
    }));
    
    console.log('Export data:', exportableData);
    toast.success('Export functionality will be implemented (static mode)');
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mt-5 border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Subscribers</CardTitle>
              <p className="text-sm text-gray-600">Manage and monitor all subscription payments</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchAllSubscriber}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={handleExport}
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {tableData.length} Active Subscribers
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-50">
                    <div className="flex items-center gap-2">
                      <span>Package</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Date Subscribed</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Amount</span>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-300" />
                        <p>No subscribers found</p>
                        <Button variant="outline" size="sm" onClick={fetchAllSubscriber}>
                          Refresh Data
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">
                        {subscriber.packageName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {subscriber.customerEmail}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscriber.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {subscriber.amount}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscriber.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => showModal(subscriber.id)}
                          disabled={subscriber.status === 'cancelled'}
                        >
                          Unsubscribe
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && tableData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Total Subscribers</p>
                    <p className="text-2xl font-bold text-blue-900">{tableData.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Active</p>
                    <p className="text-2xl font-bold text-green-900">
                      {tableData.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50 border-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {tableData.filter(s => s.status === 'pending').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50 border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Cancelled</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tableData.filter(s => s.status === 'cancelled').length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>

      {/* Unsubscribe Dialog */}
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Unsubscribe User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to unsubscribe this user? They will no longer
              receive updates and their subscription will be cancelled immediately.
            </p>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUnsubscribing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}