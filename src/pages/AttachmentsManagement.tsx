import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Clock,
  Calendar,
  User,
  Folder,
  FolderOpen,
  File,
  FilePlus,
  Link,
  Paperclip,
  Send,
  Copy,
  Move,
  Rename,
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  FilterX,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  ZoomIn,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCw,
  Edit,
  Save,
  DownloadCloud,
  HardDrive,
  Cloud,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckSquare,
  Square,
  MoreHorizontal
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SharedFile {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  metadata: {
    uploadedAt: string;
    uploadedBy: {
      id: string;
      name: string;
      avatar?: string;
    };
    conversationId: string;
    conversationName: string;
    description?: string;
    tags: string[];
    isPublic: boolean;
    isEncrypted: boolean;
    downloadCount: number;
    viewCount: number;
    shareCount: number;
    lastAccessed?: string;
    expiresAt?: string;
    version: number;
    originalName: string;
  };
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  status: 'active' | 'processing' | 'failed' | 'expired' | 'archived';
  processingProgress?: number;
  error?: string;
}

interface SharedLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  metadata: {
    sharedAt: string;
    sharedBy: {
      id: string;
      name: string;
      avatar?: string;
    };
    conversationId: string;
    conversationName: string;
    tags: string[];
    category: 'article' | 'tool' | 'resource' | 'portfolio' | 'other';
    clickCount: number;
    isVerified: boolean;
    isBookmarked: boolean;
    lastAccessed?: string;
  };
  permissions: {
    canView: boolean;
    canShare: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

interface FileFolder {
  id: string;
  name: string;
  type: 'folder';
  parentId: string | null;
  children: (FileFolder | SharedFile)[];
  metadata: {
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
    };
    itemCount: number;
    totalSize: number;
    isShared: boolean;
    sharedWith: string[];
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canShare: boolean;
    };
  };
}

interface AttachmentsManagementProps {
  conversationId?: string;
  onFileSelect?: (file: SharedFile) => void;
  onLinkSelect?: (link: SharedLink) => void;
}

export default function AttachmentsManagement({ 
  conversationId, 
  onFileSelect, 
  onLinkSelect 
}: AttachmentsManagementProps) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as string,
    dateRange: 'all' as string,
    sharedBy: 'all' as string,
    tags: [] as string[]
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [conversationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockFiles: SharedFile[] = [
        {
          id: '1',
          name: 'Product_Roadmap_2024.pdf',
          type: 'document',
          mimeType: 'application/pdf',
          size: 2048576,
          url: '/files/product-roadmap.pdf',
          thumbnailUrl: '/thumbnails/product-roadmap.jpg',
          metadata: {
            uploadedAt: '2024-01-15T10:30:00Z',
            uploadedBy: {
              id: '1',
              name: 'Sarah Chen',
              avatar: ''
            },
            conversationId: 'conv-1',
            conversationName: 'Product Team',
            description: 'Q1-Q4 product roadmap with milestones',
            tags: ['product', 'roadmap', 'planning'],
            isPublic: false,
            isEncrypted: true,
            downloadCount: 12,
            viewCount: 45,
            shareCount: 3,
            lastAccessed: '2024-01-15T14:20:00Z',
            version: 2,
            originalName: 'Product_Roadmap_2024_v2.pdf'
          },
          permissions: {
            canView: true,
            canDownload: true,
            canShare: true,
            canEdit: false,
            canDelete: false
          },
          status: 'active'
        },
        {
          id: '2',
          name: 'UI_Mockups.fig',
          type: 'image',
          mimeType: 'application/figma',
          size: 8388608,
          url: '/files/ui-mockups.fig',
          thumbnailUrl: '/thumbnails/ui-mockups.jpg',
          previewUrl: '/previews/ui-mockups.png',
          metadata: {
            uploadedAt: '2024-01-14T16:45:00Z',
            uploadedBy: {
              id: '2',
              name: 'Emily Johnson',
              avatar: ''
            },
            conversationId: 'conv-1',
            conversationName: 'Product Team',
            description: 'Latest UI designs for the mobile app',
            tags: ['design', 'ui', 'mockups'],
            isPublic: false,
            isEncrypted: false,
            downloadCount: 8,
            viewCount: 23,
            shareCount: 1,
            version: 1,
            originalName: 'UI_Mockups_v1.fig'
          },
          permissions: {
            canView: true,
            canDownload: true,
            canShare: true,
            canEdit: true,
            canDelete: true
          },
          status: 'active'
        },
        {
          id: '3',
          name: 'Team_Photo.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 3145728,
          url: '/files/team-photo.jpg',
          thumbnailUrl: '/thumbnails/team-photo.jpg',
          metadata: {
            uploadedAt: '2024-01-13T11:20:00Z',
            uploadedBy: {
              id: '3',
              name: 'Michael Rodriguez',
              avatar: ''
            },
            conversationId: 'conv-2',
            conversationName: 'Mentorship',
            description: 'Team photo from the offsite retreat',
            tags: ['team', 'photo', 'event'],
            isPublic: true,
            isEncrypted: false,
            downloadCount: 15,
            viewCount: 67,
            shareCount: 5,
            lastAccessed: '2024-01-15T09:15:00Z',
            version: 1,
            originalName: 'team_photo_retreat.jpg'
          },
          permissions: {
            canView: true,
            canDownload: true,
            canShare: true,
            canEdit: false,
            canDelete: false
          },
          status: 'active'
        }
      ];

      const mockLinks: SharedLink[] = [
        {
          id: '1',
          title: 'React Best Practices Guide',
          url: 'https://react.dev/learn/thinking-in-react',
          description: 'Official React documentation on component architecture',
          thumbnail: '/thumbnails/react-docs.jpg',
          favicon: '/favicons/react.ico',
          metadata: {
            sharedAt: '2024-01-15T09:30:00Z',
            sharedBy: {
              id: '1',
              name: 'Sarah Chen',
              avatar: ''
            },
            conversationId: 'conv-1',
            conversationName: 'Product Team',
            tags: ['react', 'documentation', 'frontend'],
            category: 'resource',
            clickCount: 8,
            isVerified: true,
            isBookmarked: false,
            lastAccessed: '2024-01-15T14:45:00Z'
          },
          permissions: {
            canView: true,
            canShare: true,
            canEdit: true,
            canDelete: false
          }
        },
        {
          id: '2',
          title: 'Figma Design System',
          url: 'https://www.figma.com/file/abc123/design-system',
          description: 'Our shared design system with components and guidelines',
          thumbnail: '/thumbnails/figma-design.jpg',
          favicon: '/favicons/figma.ico',
          metadata: {
            sharedAt: '2024-01-14T13:15:00Z',
            sharedBy: {
              id: '2',
              name: 'Emily Johnson',
              avatar: ''
            },
            conversationId: 'conv-1',
            conversationName: 'Product Team',
            tags: ['design', 'figma', 'components'],
            category: 'tool',
            clickCount: 23,
            isVerified: true,
            isBookmarked: true,
            lastAccessed: '2024-01-15T16:20:00Z'
          },
          permissions: {
            canView: true,
            canShare: true,
            canEdit: false,
            canDelete: false
          }
        }
      ];

      setFiles(mockFiles);
      setLinks(mockLinks);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load attachments and links. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId || '');

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // API call to upload file
        // await api.attachments.upload(formData);
      }

      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been uploaded.`
      });

      loadData();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileAction = async (fileId: string, action: 'download' | 'share' | 'delete' | 'rename') => {
    try {
      switch (action) {
        case 'download':
          // API call to download file
          // await api.attachments.download(fileId);
          toast({
            title: "Download started",
            description: "Your file download has started."
          });
          break;
        case 'share':
          // API call to generate share link
          // const shareLink = await api.attachments.share(fileId);
          toast({
            title: "Share link generated",
            description: "Share link has been copied to clipboard."
          });
          break;
        case 'delete':
          // API call to delete file
          // await api.attachments.delete(fileId);
          setFiles(prev => prev.filter(f => f.id !== fileId));
          toast({
            title: "File deleted",
            description: "The file has been deleted successfully."
          });
          break;
        case 'rename':
          // Handle rename dialog
          break;
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: `Failed to ${action} the file. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleLinkAction = async (linkId: string, action: 'open' | 'bookmark' | 'delete' | 'share') => {
    try {
      switch (action) {
        case 'open':
          window.open(links.find(l => l.id === linkId)?.url, '_blank');
          break;
        case 'bookmark':
          setLinks(prev => 
            prev.map(link => 
              link.id === linkId 
                ? { ...link, metadata: { ...link.metadata, isBookmarked: !link.metadata.isBookmarked } }
                : link
            )
          );
          break;
        case 'delete':
          setLinks(prev => prev.filter(l => l.id !== linkId));
          toast({
            title: "Link deleted",
            description: "The link has been removed."
          });
          break;
        case 'share':
          toast({
            title: "Link shared",
            description: "The link has been shared to the conversation."
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: `Failed to ${action} the link. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilters = 
      (filters.type === 'all' || file.type === filters.type) &&
      (filters.tags.length === 0 || filters.tags.some(tag => file.metadata.tags.includes(tag)));
    
    return matchesSearch && matchesFilters;
  });

  const filteredLinks = links.filter(link => {
    const matchesSearch = searchQuery === '' || 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilters = 
      (filters.tags.length === 0 || filters.tags.some(tag => link.metadata.tags.includes(tag)));
    
    return matchesSearch && matchesFilters;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.metadata.uploadedAt).getTime() - new Date(b.metadata.uploadedAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'document': return FileText;
      case 'video': return Video;
      case 'audio': return Music;
      case 'archive': return Archive;
      default: return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffInDays < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const stats = {
    totalFiles: files.length,
    totalLinks: links.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    recentFiles: files.filter(f => {
      const diffInDays = (new Date().getTime() - new Date(f.metadata.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
      return diffInDays < 7;
    }).length,
    sharedFiles: files.filter(f => f.metadata.isPublic).length,
    encryptedFiles: files.filter(f => f.metadata.isEncrypted).length
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r p-4 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Attachments & Resources</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search files and links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm">{stats.totalFiles}</div>
              <div className="text-xs text-muted-foreground">Files</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm">{stats.totalLinks}</div>
              <div className="text-xs text-muted-foreground">Links</div>
            </div>
          </div>

          {/* Storage Info */}
          <div className="p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Storage Used</span>
              <span>{formatFileSize(stats.totalSize)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">35% of 10GB used</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Link className="w-4 h-4" />
              Share Link
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <FolderPlus className="w-4 h-4" />
              Create Folder
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          {showFilters && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Type</label>
                <select 
                  value={filters.type} 
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full text-xs p-1 border rounded"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Shared Resources</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm p-1 border rounded"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="type">Sort by Type</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button size="sm" disabled={uploading} className="gap-2">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="folders">Folders</TabsTrigger>
            </TabsList>
          </div>

          {/* Files Tab */}
          <TabsContent value="files" className="flex-1 p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="relative mb-3">
                            {file.thumbnailUrl ? (
                              <img 
                                src={file.thumbnailUrl} 
                                alt={file.name}
                                className="w-full h-24 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                                <FileIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Status indicators */}
                            <div className="absolute top-1 right-1 flex flex-col space-y-1">
                              {file.metadata.isEncrypted && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {file.metadata.isPublic && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Eye className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <div className="flex space-x-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onFileSelect?.(file)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleFileAction(file.id, 'download')}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm truncate">{file.name}</h4>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(file.metadata.uploadedAt)}
                              </span>
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={file.metadata.uploadedBy.avatar} />
                                <AvatarFallback className="text-xs">
                                  {file.metadata.uploadedBy.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <FileIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">{file.name}</h4>
                                <div className="flex items-center space-x-1">
                                  {file.metadata.isEncrypted && <Lock className="w-3 h-3 text-blue-500" />}
                                  {file.metadata.isPublic && <Eye className="w-3 h-3 text-green-500" />}
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-2">
                                {formatFileSize(file.size)} • {formatTimestamp(file.metadata.uploadedAt)}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={file.metadata.uploadedBy.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {file.metadata.uploadedBy.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    {file.metadata.uploadedBy.name}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onFileSelect?.(file)}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileAction(file.id, 'download')}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFileAction(file.id, 'share')}
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="flex-1 p-4">
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleLinkAction(link.id, 'open')}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {link.favicon ? (
                            <img src={link.favicon} alt="" className="w-6 h-6" />
                          ) : (
                            <Link className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate">{link.title}</h4>
                            <div className="flex items-center space-x-1">
                              {link.metadata.isVerified && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                              {link.metadata.isBookmarked && (
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                          </div>
                          
                          {link.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {link.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={link.metadata.sharedBy.avatar} />
                                <AvatarFallback className="text-xs">
                                  {link.metadata.sharedBy.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {link.metadata.sharedBy.name}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(link.metadata.sharedAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-muted-foreground">
                                {link.metadata.clickCount} clicks
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLinkAction(link.id, 'bookmark');
                                }}
                              >
                                <Star className={`w-3 h-3 ${link.metadata.isBookmarked ? 'text-yellow-500 fill-current' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Folders Tab */}
          <TabsContent value="folders" className="flex-1 p-4">
            <div className="text-center space-y-4">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Folders Coming Soon</h3>
              <p className="text-muted-foreground">
                Organize your files into folders for better management
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{previewFile.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4">
                {previewFile.type === 'image' && previewFile.url && (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name}
                    className="max-w-full h-auto rounded"
                  />
                )}
                
                {previewFile.type === 'document' && (
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                    <p>Document preview not available</p>
                    <Button onClick={() => handleFileAction(previewFile.id, 'download')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
