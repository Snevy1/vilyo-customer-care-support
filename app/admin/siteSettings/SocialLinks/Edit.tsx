"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCw,
  Save,
  ExternalLink,
  Globe,
  AlertTriangle,
  CheckCircle,
  MoveLeft,
  MoveRight,
  Trash2,
  Edit
} from "lucide-react";
import AddEditSocialLink from "./AddEditSocialLink";
import { SocialLink } from "@/@types/types"; 

// Static data for migration
const staticSocialLinks: SocialLink[] = [
  {
    id: "1",
    name: "Facebook",
    link: "https://facebook.com",
    icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    platform: "facebook"
  },
  {
    id: "2",
    name: "Twitter",
    link: "https://twitter.com",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
    platform: "twitter"
  },
  {
    id: "3",
    name: "Instagram",
    link: "https://instagram.com",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    platform: "instagram"
  },
  {
    id: "4",
    name: "LinkedIn",
    link: "https://linkedin.com",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    platform: "linkedin"
  }
];

export default function EditSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch social links
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // TODO: Uncomment for API integration
        /*
        const response = await fetch('/api/settings/social-links', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch social links');
        
        const data = await response.json();
        setLinks(data);
        */
        
        // Static implementation
        setTimeout(() => {
          setLinks(staticSocialLinks);
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching social links:', error);
        setError('Failed to load social links. Using demo data.');
        setLinks(staticSocialLinks);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Move link left
  const handleMoveLeft = (index: number) => {
    if (index > 0) {
      setLinks(prev => {
        const newLinks = [...prev];
        [newLinks[index], newLinks[index - 1]] = [newLinks[index - 1], newLinks[index]];
        return newLinks;
      });
      toast.info('Link position updated');
    }
  };

  // Move link right
  const handleMoveRight = (index: number) => {
    if (index < links.length - 1) {
      setLinks(prev => {
        const newLinks = [...prev];
        [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
        return newLinks;
      });
      toast.info('Link position updated');
    }
  };

  // Delete a link
  const handleDeleteLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    toast.success('Link removed');
  };

  // Add or update a link
  const handleAddOrUpdateLink = (updatedLink: SocialLink) => {
    if (links.some(link => link.id === updatedLink.id)) {
      // Update existing
      setLinks(prev => prev.map(link => 
        link.id === updatedLink.id ? updatedLink : link
      ));
      toast.success('Link updated successfully');
    } else {
      // Add new
      setLinks(prev => [...prev, updatedLink]);
      toast.success('Link added successfully');
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/settings/social-links', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socialLinks: links }),
      });
      
      if (!response.ok) throw new Error('Failed to save changes');
      */
      
      // Static implementation
      setTimeout(() => {
        console.log('Saving links:', links);
        toast.success('Social links saved successfully! (static mode)');
        setSaveDialogOpen(false);
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save changes. Please try again.');
      setIsSaving(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLinks(staticSocialLinks);
      setLoading(false);
      toast.info('Data refreshed');
    }, 500);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Demo Mode</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">{error}</p>
        </div>
        <SocialLinksContent 
          links={links}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onDelete={handleDeleteLink}
          onAddOrUpdate={handleAddOrUpdateLink}
          onSave={() => setSaveDialogOpen(true)}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <SocialLinksContent 
      links={links}
      onMoveLeft={handleMoveLeft}
      onMoveRight={handleMoveRight}
      onDelete={handleDeleteLink}
      onAddOrUpdate={handleAddOrUpdateLink}
      onSave={() => setSaveDialogOpen(true)}
      onRefresh={handleRefresh}
    />
  );
}

interface SocialLinksContentProps {
  links: SocialLink[];
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onDelete: (id: string) => void;
  onAddOrUpdate: (link: SocialLink) => void;
  onSave: () => void;
  onRefresh: () => void;
}

function SocialLinksContent({
  links,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onAddOrUpdate,
  onSave,
  onRefresh
}: SocialLinksContentProps) {
  // Add these state variables inside the component
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Move handleSaveChanges inside the component
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // TODO: Uncomment for API integration
      /*
      const response = await fetch('/api/settings/social-links', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socialLinks: links }),
      });
      
      if (!response.ok) throw new Error('Failed to save changes');
      */
      
      // Static implementation
      setTimeout(() => {
        console.log('Saving links:', links);
        toast.success('Social links saved successfully! (static mode)');
        setSaveDialogOpen(false);
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save changes. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="h-6 w-6 text-[#3838F0]" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Manage your social media profiles and their display order
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onRefresh}
                className="border-[#6666B3] text-[#6666B3] hover:bg-[#6666B3] hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={() => setSaveDialogOpen(true)} // Updated to use local state
                className="bg-[#3838F0] hover:bg-[#2a2ac7]"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)] pr-4">
            <div className="space-y-4">
              {/* Existing Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {links.map((link, index) => (
                  <SocialLinkCard
                    key={link.id}
                    link={link}
                    index={index}
                    totalLinks={links.length}
                    onMoveLeft={() => onMoveLeft(index)}
                    onMoveRight={() => onMoveRight(index)}
                    onDelete={() => onDelete(link.id)}
                    onEdit={() => onAddOrUpdate({...link})}
                  />
                ))}
                
                {/* Add New Link Card */}
                <AddNewLinkCard onAdd={onAddOrUpdate} />
              </div>
              
              {/* Instructions */}
              <Card className="bg-blue-50 border-blue-100 mt-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">How to manage links:</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          <MoveLeft className="h-3 w-3" />
                          Use arrows to change display order
                        </li>
                        <li className="flex items-center gap-2">
                          <Edit className="h-3 w-3" />
                          Click "Edit" to modify link details
                        </li>
                        <li className="flex items-center gap-2">
                          <Trash2 className="h-3 w-3" />
                          Click "Delete" to remove a link
                        </li>
                        <li className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Add new links using the "+ Add Link" card
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Save Changes Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Save Changes
            </DialogTitle>
            <DialogDescription>
              Review your changes before saving
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-gray-700">
              Are you sure you want to save these changes to your social links?
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Preview:</h4>
              <div className="flex flex-wrap gap-3">
                {links.map(link => (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 bg-white px-3 py-2 rounded border"
                  >
                    {link.icon ? (
                      <img 
                        src={link.icon} 
                        alt={link.name}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <div className="h-5 w-5 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs">{link.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium">{link.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveChanges} // Now using the local function
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SocialLinkCardProps {
  link: SocialLink;
  index: number;
  totalLinks: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function SocialLinkCard({
  link,
  index,
  totalLinks,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onEdit
}: SocialLinkCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="relative overflow-hidden border hover:border-[#3838F0] transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Navigation Arrows */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveLeft}
            disabled={index === 0}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="text-xs">
            Position {index + 1} of {totalLinks}
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveRight}
            disabled={index === totalLinks - 1}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator className="mb-4" />
        
        {/* Link Content */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Icon */}
          <div className="p-3 bg-gray-100 rounded-full">
            {link.icon ? (
              <img 
                src={link.icon} 
                alt={link.name}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/32x32/cccccc/666666?text=?';
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {link.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          {/* Name and Link */}
          <div className="space-y-1">
            <h3 className="font-medium text-gray-800">{link.name}</h3>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate max-w-[120px]">
                {link.link.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 w-full">
            <AddEditSocialLink
              data={link}
              onSave={(updatedLink) => {
                // This will be handled by parent
                onEdit();
              }}
              mode="edit"
            >
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </AddEditSocialLink>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AddNewLinkCardProps {
  onAdd: (link: SocialLink) => void;
}

function AddNewLinkCard({ onAdd }: AddNewLinkCardProps) {
  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-[#3838F0] hover:bg-gray-50 transition-colors">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
          <div className="p-3 bg-gray-100 rounded-full">
            <Globe className="h-8 w-8 text-gray-400" />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-1">Add New Link</h3>
            <p className="text-sm text-gray-500">
              Add a new social media profile
            </p>
          </div>
          
          <AddEditSocialLink
            onSave={onAdd}
            mode="add"
          >
            <Button 
              variant="default" 
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              + Add Link
            </Button>
          </AddEditSocialLink>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-7 w-7 rounded" />
                  </div>
                  <Skeleton className="h-[1px] w-full" />
                  <div className="flex flex-col items-center space-y-3">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-2 w-full">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}