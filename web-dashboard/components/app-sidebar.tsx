"use client"

import Image from "next/image"

import {
  BarChart3,
  Briefcase,
  FileText,
  Home,
  LineChart,
  Settings,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "대시보드",
    url: "/",
    icon: Home,
  },
  {
    title: "예측 결과",
    url: "/predictions",
    icon: LineChart,
  },
  {
    title: "포트폴리오",
    url: "/portfolio",
    icon: Briefcase,
  },
  {
    title: "수익률 분석",
    url: "/returns",
    icon: TrendingUp,
  },
  {
    title: "팩트시트",
    url: "/factsheet",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {/* <BarChart3 className="h-6 w-6 text-primary" /> */}
          <div className="relative h-8 w-8">
            <Image
              src="/icon.png"
              alt="ETF Trading Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-lg">ETF Trading</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={pathname === item.url}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
