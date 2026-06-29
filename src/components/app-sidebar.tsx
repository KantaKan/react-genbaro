import * as React from "react";
import {
  GalleryVerticalEnd,
  SquareTerminal,
  BookOpen,
  FileText,
  MessageSquare,
  Table,
  Users,
  Calendar,
  User,
  Hammer,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "../AuthContext";
import type { UserRole } from "../types/auth";

const teams = [
  {
    name: "Generation Thailand",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
];

// Feature flag for the 'New' indicator
const showNewTalkBoardIndicator = true; // Set to false to hide the 'New' indicator

// Navigation configurations for different roles
const navigationConfig: Record<UserRole, any[]> = {
  admin: [
    {
      title: "Dashboard Panel",
      url: "Dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "All Users Reflections",
          url: "/admin/table",
          icon: Table, // Add icon for sub-menu item
        },
        {
          title: "Admin Panel",
          url: "/admin",
          icon: SquareTerminal, // Add icon for sub-menu item
        },
        {
          title: "All Users",
          url: "/admin/users",
          icon: Users, // Add icon for sub-menu item
        },
        {
          title: "Learner Directory",
          url: "/learner/directory",
          icon: Users,
        },
        {
          title: "Weekly Summary",
          url: "/admin/weekly-summary",
          icon: Calendar, // Add icon for sub-menu item
        },
        {
          title: "Attendance",
          url: "/admin/attendance",
          icon: ClipboardCheck,
          isActive: true,
          items: [
            { title: "Register", url: "/admin/attendance/register", icon: ClipboardCheck },
            { title: "All Students", url: "/admin/attendance/all-students", icon: Users },
            { title: "Calendar", url: "/admin/attendance/calendar", icon: Calendar },
            { title: "Logs", url: "/admin/attendance/logs", icon: FileText },
            { title: "Leave", url: "/admin/attendance/leave", icon: BookOpen },
          ],
        },
        {
          title: "Notifications",
          url: "/admin/notifications",
          icon: Bell,
        },
        {
          title: "Tools",
          url: "/tools",
          icon: Hammer, // Add icon for sub-menu item
        },
      ],
    },
    {
      title: "Talk Board",
      url: "/talk-board",
      icon: MessageSquare,
      isActive: false,
      badge: showNewTalkBoardIndicator ? ( // Add badge conditionally
        <motion.div
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
            New
          </Badge>
        </motion.div>
      ) : undefined,
      items: [
        {
          title: "Discussion",
          url: "/talk-board",
          icon: MessageSquare, // Add icon for sub-menu item
        },
      ],
    },
  ],
  learner: [
    {
      title: "Learning Dashboard",
      url: "/dashboard",
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: "My Reflections",
          url: "/learner",
          icon: User, // Add icon for sub-menu item
        },
        {
          title: "My Profile",
          url: "/learner/my-profile",
          icon: User,
        },
        {
          title: "Attendance",
          url: "/learner/attendance",
          icon: ClipboardCheck,
        },
        {
          title: "Learner Directory",
          url: "/learner/directory",
          icon: Users,
        },
      ],
    },
    {
      title: "Talk Board",
      url: "/talk-board",
      icon: MessageSquare,
      isActive: false,
      badge: showNewTalkBoardIndicator ? ( // Add badge conditionally
        <motion.div
          initial={{ opacity: 0.5, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
            New
          </Badge>
        </motion.div>
      ) : undefined,
      items: [
        {
          title: "Discussion",
          url: "/talk-board",
          icon: MessageSquare, // Add icon for sub-menu item
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userRole, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Get navigation items based on user role
  const navItems = userRole ? navigationConfig[userRole] : [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Only show TeamSwitcher for admin users */}
        {userRole === "admin" && <TeamSwitcher teams={teams} />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
