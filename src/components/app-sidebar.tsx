import * as React from "react";
import { GalleryVerticalEnd, SquareTerminal, BookOpen, FileText } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { useAuth } from "../AuthContext";

const teams = [
  {
    name: "Generation Thailand",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
];

// Navigation configurations for different roles
const navigationConfig = {
  admin: [
    {
      title: "Dashboard Panel",
      url: "Dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "AllUserReflections",
          url: "/admin/table",
        },
        {
          title: "AdminPanel",
          url: "/admin",
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
          url: "/reflections",
        },
        {
          title: "Learning Materials",
          url: "/materials",
        },
      ],
    },
    {
      title: "Assignments",
      url: "/assignments",
      icon: FileText,
      items: [
        {
          title: "Current Tasks",
          url: "/assignments/current",
        },
        {
          title: "Completed Work",
          url: "/assignments/completed",
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
  const navItems = userRole ? navigationConfig[userRole as keyof typeof navigationConfig] : [];

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
