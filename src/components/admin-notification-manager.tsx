import { useState, useEffect } from "react";
import { notificationService } from "../application/services/notificationService";
import type { Notification, CreateNotificationRequest } from "../domain/types/notification";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Bell, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { format } from "date-fns";

export function AdminNotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<CreateNotificationRequest>({
    title: "",
    message: "",
    link: "",
    link_text: "",
    is_active: true,
    priority: "normal",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getAllNotifications();
      console.log("Admin notifications response:", response);
      setNotifications(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, formData);
        toast.success("Notification updated successfully");
      } else {
        await notificationService.createNotification(formData);
        toast.success("Notification created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      loadNotifications();
    } catch (error) {
      toast.error("Failed to save notification");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await notificationService.deleteNotification(id);
      toast.success("Notification deleted successfully");
      loadNotifications();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      await notificationService.toggleNotificationActive(notification.id, !notification.is_active);
      toast.success(`Notification ${notification.is_active ? "deactivated" : "activated"} successfully`);
      loadNotifications();
    } catch (error) {
      toast.error("Failed to update notification status");
    }
  };

  const openEditDialog = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      link: notification.link || "",
      link_text: notification.link_text || "",
      is_active: notification.is_active,
      priority: notification.priority,
      start_date: notification.start_date,
      end_date: notification.end_date,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNotification(null);
    setFormData({
      title: "",
      message: "",
      link: "",
      link_text: "",
      is_active: true,
      priority: "normal",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "important":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Important</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Manager
          </h1>
          <p className="text-muted-foreground">Create and manage notifications for learners</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? "Edit Notification" : "Create New Notification"}
              </DialogTitle>
              <DialogDescription>
                {editingNotification
                  ? "Update the notification details below"
                  : "Fill in the details to create a new notification"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Notification message"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="link">Link URL (optional)</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link_text">Link Text</Label>
                  <Input
                    id="link_text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="Click here"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "normal" | "important" | "urgent") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Active</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.title || !formData.message}>
                {editingNotification ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)} className="mt-2">
                Create your first notification
              </Button>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={!notification.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {notification.title}
                      {getPriorityBadge(notification.priority)}
                    </CardTitle>
                    <CardDescription>{notification.message}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notification.is_active}
                      onCheckedChange={() => handleToggleActive(notification)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(notification)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {notification.link && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Link:</span>
                      <span className="text-primary">{notification.link_text || notification.link}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Start:</span>
                    <span>{format(new Date(notification.start_date), "MMM dd, yyyy HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">End:</span>
                    <span>{format(new Date(notification.end_date), "MMM dd, yyyy HH:mm")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminNotificationManager;
