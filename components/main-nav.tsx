import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const mainNavItems = [
  {
    title: "Features",
    href: "/features",
  },
  {
    title: "Blog",
    href: "/blog",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === item.href ? "text-foreground" : "text-foreground/60"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 