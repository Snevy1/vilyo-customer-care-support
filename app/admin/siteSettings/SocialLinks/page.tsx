"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ExternalLink, Upload, Edit } from "lucide-react";
import { toast } from "react-toastify";

// Static data for migration
const staticSocialLinks = [
  {
    id: "1",
    name: "Facebook",
    icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    link: "https://facebook.com",
    platform: "facebook"
  },
  {
    id: "2",
    name: "Twitter",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
    link: "https://twitter.com",
    platform: "twitter"
  },
  {
    id: "3",
    name: "Instagram",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    link: "https://instagram.com",
    platform: "instagram"
  },
  {
    id: "4",
    name: "LinkedIn",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    link: "https://linkedin.com",
    platform: "linkedin"
  }
];

const staticSiteLogos = [
  {
    id: "1",
    name: "Website logo",
    description: "Main logo displayed on your website",
    image: "/images/website-logo.png",
    type: "website"
  },
  {
    id: "2",
    name: "Admin logo",
    description: "Logo shown in admin dashboard",
    image: "/images/admin-logo.png",
    type: "admin"
  },
  {
    id: "3",
    name: "Fav Icon",
    description: "Browser tab icon (16x16 or 32x32 pixels)",
    image: "/images/favicon.png",
    type: "favicon"
  },
  {
    id: "4",
    name: "Footer Icon",
    description: "Logo displayed in website footer",
    image: "/images/footer-logo.png",
    type: "footer"
  }
];

interface SocialLink {
  id: string;
  name: string;
  icon?: string;
  link: string;
  platform: string;
}

interface SiteLogo {
  id: string;
  name: string;
  description?: string;
  image: string;
  type: string;
}

export default function SocialMediaSettings() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [siteLogos, setSiteLogos] = useState<SiteLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // TODO: Uncomment for API integration
        /*
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const data = await response.json();
        
        // Extract social links and logos from response
        const socialLinksData = data.socialLinks || [];
        const siteLogosData = data.siteLogos || [];
        
        setSocialLinks(socialLinksData);
        setSiteLogos(siteLogosData);
        */
        
        // Static implementation
        setTimeout(() => {
          setSocialLinks(staticSocialLinks);
          setSiteLogos(staticSiteLogos);
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load settings data. Using static data for now.');
        
        // Fallback to static data
        setSocialLinks(staticSocialLinks);
        setSiteLogos(staticSiteLogos);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle social link updates
  const handleSocialLinkUpdate = (id: string, updatedLink: Partial<SocialLink>) => {
    setSocialLinks(prev => 
      prev.map(link => 
        link.id === id ? { ...link, ...updatedLink } : link
      )
    );
    
    // TODO: Add API call to save changes
    toast.success(`Updated ${updatedLink.name || 'social link'} (static mode)`);
  };

  // Handle logo updates
  const handleLogoUpdate = (id: string, newImageUrl: string) => {
    setSiteLogos(prev =>
      prev.map(logo =>
        logo.id === id ? { ...logo, image: newImageUrl } : logo
      )
    );
    
    // TODO: Add API call to save changes
    toast.success('Logo updated (static mode)');
  };

  // Navigate to edit page
  const navigateToEdit = (type: 'social' | 'logos') => {
    // TODO: Implement navigation
    toast.info(`Edit ${type} page will be implemented`);
    console.log(`Navigate to edit ${type}`);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-700">Error Loading Data</span>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
        <SettingsContent 
          socialLinks={socialLinks}
          siteLogos={siteLogos}
          onSocialLinkUpdate={handleSocialLinkUpdate}
          onLogoUpdate={handleLogoUpdate}
          onNavigate={navigateToEdit}
        />
      </div>
    );
  }

  return (
    <SettingsContent 
      socialLinks={socialLinks}
      siteLogos={siteLogos}
      onSocialLinkUpdate={handleSocialLinkUpdate}
      onLogoUpdate={handleLogoUpdate}
      onNavigate={navigateToEdit}
    />
  );
}

interface SettingsContentProps {
  socialLinks: SocialLink[];
  siteLogos: SiteLogo[];
  onSocialLinkUpdate: (id: string, updatedLink: Partial<SocialLink>) => void;
  onLogoUpdate: (id: string, newImageUrl: string) => void;
  onNavigate: (type: 'social' | 'logos') => void;
}

function SettingsContent({
  socialLinks,
  siteLogos,
  onSocialLinkUpdate,
  onLogoUpdate,
  onNavigate
}: SettingsContentProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Social Links Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Manage your social media profiles and links
              </CardDescription>
            </div>
            <Button 
              onClick={() => onNavigate('social')}
              className="bg-[#3838F0] hover:bg-[#2a2ac7]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit All Links
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <Label className="text-gray-500 mb-4 block text-center">
              Preview
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {socialLinks.map((link) => (
                <SocialLinkCard
                  key={link.id}
                  link={link}
                  onUpdate={(updatedLink) => onSocialLinkUpdate(link.id, updatedLink)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Logos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Website Logos</CardTitle>
          <CardDescription>
            Manage different logos used across your website
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Separator />
          
          <div className="space-y-6">
            {siteLogos.map((logo) => (
              <LogoRow
                key={logo.id}
                logo={logo}
                onUpdate={(newImageUrl) => onLogoUpdate(logo.id, newImageUrl)}
              />
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => onNavigate('logos')}
              variant="outline"
              className="border-[#3838F0] text-[#3838F0] hover:bg-[#3838F0] hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Logos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SocialLinkCardProps {
  link: SocialLink;
  onUpdate?: (updatedLink: Partial<SocialLink>) => void;
}

function SocialLinkCard({ link, onUpdate }: SocialLinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState(link.link);

  const handleSave = () => {
    if (onUpdate && newUrl !== link.link) {
      onUpdate({ link: newUrl });
    }
    setIsEditing(false);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-blue-100 text-blue-700';
      case 'twitter': return 'bg-sky-100 text-sky-700';
      case 'instagram': return 'bg-pink-100 text-pink-700';
      case 'linkedin': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Platform Icon/Image */}
          <div className={`p-3 rounded-full ${getPlatformColor(link.platform)}`}>
            {link.icon ? (
              <img 
                src={link.icon} 
                alt={link.name}
                className="h-6 w-6 object-contain"
              />
            ) : (
              <div className="h-6 w-6 flex items-center justify-center font-bold">
                {link.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Platform Name */}
          <div>
            <h3 className="font-medium text-gray-800">{link.name}</h3>
            <div className="flex items-center justify-center gap-1 mt-1">
              <ExternalLink className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-500 truncate max-w-30">
                {link.link.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
          
          {/* Edit/Save Buttons */}
          {isEditing ? (
            <div className="w-full space-y-2">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter URL"
                className="text-sm h-8"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="h-7">
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setNewUrl(link.link);
                  }}
                  className="h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : onUpdate ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-7 w-full"
            >
              Edit URL
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface LogoRowProps {
  logo: SiteLogo;
  onUpdate?: (newImageUrl: string) => void;
}

function LogoRow({ logo, onUpdate }: LogoRowProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdate) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);

    // TODO: Upload to server and get URL
    // For now, we'll simulate with a placeholder
    setTimeout(() => {
      const simulatedUrl = `https://via.placeholder.com/150x50/3838F0/ffffff?text=${encodeURIComponent(logo.name)}`;
      onUpdate(simulatedUrl);
      toast.success(`${logo.name} updated (static mode)`);
      setPreviewImage(null);
    }, 1000);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Logo Preview */}
        <div className="shrink-0">
          <div className="bg-white p-2 rounded border">
            <img
              src={previewImage || logo.image}
              alt={logo.name}
              className="h-10 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/150x50/cccccc/666666?text=Logo';
              }}
            />
          </div>
        </div>
        
        {/* Logo Details */}
        <div>
          <h3 className="font-medium text-gray-800">{logo.name}</h3>
          {logo.description && (
            <p className="text-sm text-gray-600">{logo.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Recommended: {logo.type === 'favicon' ? '16x16 or 32x32 PNG' : '150x50 PNG'}
          </p>
        </div>
      </div>
      
      {/* Upload Button */}
      {onUpdate && (
        <div className="shrink-0">
          <Label htmlFor={`logo-upload-${logo.id}`} className="cursor-pointer">
            <Button
              variant="outline"
              className="border-[#6666B3] text-[#6666B3] hover:bg-[#6666B3] hover:text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Change Logo
            </Button>
          </Label>
          <input
            id={`logo-upload-${logo.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Social Links Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site Logos Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-24" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}