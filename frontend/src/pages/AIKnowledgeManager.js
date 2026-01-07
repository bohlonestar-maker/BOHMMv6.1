import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Database, BookOpen, Users, Shield, Calendar, Lock } from "lucide-react";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'general', label: 'General Info', icon: BookOpen, color: 'bg-blue-500' },
  { value: 'chain_of_command', label: 'Chain of Command', icon: Users, color: 'bg-green-500' },
  { value: 'bylaws', label: 'Bylaws & Rules', icon: Shield, color: 'bg-yellow-500' },
  { value: 'meetings', label: 'Meetings & Events', icon: Calendar, color: 'bg-purple-500' },
  { value: 'admin_only', label: 'Admin Only', icon: Lock, color: 'bg-red-500' },
];

function AIKnowledgeManager({ token }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    is_active: true,
    admin_only: false
  });

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/ai-knowledge`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Access denied. Only NPrez, NVP, or NSEC can manage AI knowledge.");
      } else {
        toast.error("Failed to load knowledge entries");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleInitialize = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-knowledge/initialize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to initialize knowledge base");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await axios.put(`${BACKEND_URL}/api/ai-knowledge/${editingEntry.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Knowledge entry updated");
      } else {
        await axios.post(`${BACKEND_URL}/api/ai-knowledge`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Knowledge entry created");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save entry");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this knowledge entry?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/ai-knowledge/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Knowledge entry deleted");
      fetchEntries();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const handleToggleActive = async (entry) => {
    try {
      await axios.put(`${BACKEND_URL}/api/ai-knowledge/${entry.id}`, {
        is_active: !entry.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Entry ${entry.is_active ? 'disabled' : 'enabled'}`);
      fetchEntries();
    } catch (error) {
      toast.error("Failed to update entry");
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      is_active: true,
      admin_only: false
    });
    setEditingEntry(null);
  };

  const openEditDialog = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      is_active: entry.is_active,
      admin_only: entry.admin_only
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryInfo = (categoryValue) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[0];
  };

  const filteredEntries = selectedCategory === 'all' 
    ? entries 
    : entries.filter(e => e.category === selectedCategory);

  const entriesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = entries.filter(e => e.category === cat.value);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            AI Knowledge Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage information the BOH AI Assistant uses to answer questions
          </p>
        </div>
        <div className="flex gap-2">
          {entries.length === 0 && (
            <Button variant="outline" onClick={handleInitialize}>
              <Database className="h-4 w-4 mr-2" />
              Initialize Default Knowledge
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEntry ? 'Edit' : 'Add'} Knowledge Entry</DialogTitle>
                <DialogDescription>
                  {editingEntry ? 'Update the knowledge entry below' : 'Add new information for the AI assistant'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Chain of Command"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value, admin_only: value === 'admin_only'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Enter the information the AI should know..."
                    rows={10}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use bullet points (-) or numbered lists for better organization
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="admin_only"
                      checked={formData.admin_only}
                      onCheckedChange={(checked) => setFormData({...formData, admin_only: checked})}
                    />
                    <Label htmlFor="admin_only">Admin Only</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEntry ? 'Update' : 'Create'} Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => setSelectedCategory('all')}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{entries.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        {CATEGORIES.map((cat) => (
          <Card 
            key={cat.value} 
            className={`cursor-pointer hover:bg-accent ${selectedCategory === cat.value ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{entriesByCategory[cat.value]?.length || 0}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <cat.icon className="h-3 w-3" />
                {cat.label.split(' ')[0]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entries List */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No knowledge entries found</p>
                  {entries.length === 0 && (
                    <Button variant="link" onClick={handleInitialize}>
                      Initialize with default knowledge
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredEntries.map((entry) => {
                const catInfo = getCategoryInfo(entry.category);
                return (
                  <Card key={entry.id} className={!entry.is_active ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{entry.title}</CardTitle>
                            <Badge variant="outline" className={`${catInfo.color} text-white text-xs`}>
                              {catInfo.label}
                            </Badge>
                            {entry.admin_only && (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Admin Only
                              </Badge>
                            )}
                            {!entry.is_active && (
                              <Badge variant="secondary" className="text-xs">Disabled</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs mt-1">
                            Updated by {entry.updated_by} • {new Date(entry.updated_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(entry)}
                            title={entry.is_active ? 'Disable' : 'Enable'}
                          >
                            {entry.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap font-sans bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                        {entry.content}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export default AIKnowledgeManager;
