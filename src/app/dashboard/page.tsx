import { useParams, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { CustomSidebarProvider } from "@/components/custom-sidebar-provider";

export default function Page({ children }: { children: React.ReactNode }, props: any) {
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) return null;

    const items: React.ReactNode[] = [];
    
    if (pathSegments[0] === 'admin') {
      items.push(
        <BreadcrumbItem key="admin">
          <BreadcrumbLink href="/admin" className="text-primary hover:underline">Admin</BreadcrumbLink>
        </BreadcrumbItem>
      );

      if (pathSegments[1]) {
        items.push(<BreadcrumbSeparator key="sep1" />);
        
        const pageNames: Record<string, string> = {
          'table': 'All Reflections',
          'users': 'User Management',
          'weekly-summary': 'Weekly Summary',
        };
        
        const pageName = pageNames[pathSegments[1]] || pathSegments[1];
        
        if (pathSegments[2]) {
          items.push(
            <BreadcrumbItem key={pathSegments[1]}>
              <BreadcrumbLink href={`/admin/${pathSegments[1]}`} className="text-primary hover:underline">
                {pageName}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
          items.push(<BreadcrumbSeparator key="sep2" />);
          items.push(
            <BreadcrumbItem key={pathSegments[2]}>
              <BreadcrumbPage>User Details</BreadcrumbPage>
            </BreadcrumbItem>
          );
        } else {
          items.push(
            <BreadcrumbItem key={pathSegments[1]}>
              <BreadcrumbPage>{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          );
        }
      }
    } else if (pathSegments[0] === 'learner') {
      items.push(
        <BreadcrumbItem key="learner">
          <BreadcrumbPage>Learner Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else if (pathSegments[0] === 'talk-board') {
      items.push(
        <BreadcrumbItem key="talkboard">
          {pathSegments[1] ? (
            <>
              <BreadcrumbLink href="/talk-board" className="text-primary hover:underline">Talk Board</BreadcrumbLink>
              <BreadcrumbSeparator />
              <BreadcrumbPage>Discussion</BreadcrumbPage>
            </>
          ) : (
            <BreadcrumbPage>Talk Board</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      );
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <CustomSidebarProvider>
      <div className="flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-hidden ">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <ModeToggle />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="p-4 flex-1 ">{children}</div>
        </main>
      </div>
    </CustomSidebarProvider>
  );
}
