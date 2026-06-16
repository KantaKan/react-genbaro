import React from "react";
import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/UserDataContext";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { userData, loading, error, clearUserData } = useUserData();

  const handleLogout = () => {
    clearUserData();
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="grid gap-1 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error loading user data</div>;
  }

  const { _id, first_name, last_name, email } = userData || {};

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <UserAvatar userId={_id} firstName={first_name} lastName={last_name} email={email} className="h-8 w-8 rounded-lg" fallbackClassName="rounded-lg" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{first_name || "User"}</span>
                <span className="truncate text-xs">{email || ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar userId={_id} firstName={first_name} lastName={last_name} email={email} className="h-8 w-8 rounded-lg" fallbackClassName="rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{first_name || "User"}</span>
                  <span className="truncate text-xs">{email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
