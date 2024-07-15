"use client"
import DiscordLoginButton from "@/components/DiscordLoginButton"
import { useIdToken } from "@/helpers/hooks/useIdToken"
import { IdTokenJWT } from "@/helpers/oauth/types"
import { Crown } from "@/icons/Crown"
import { useAnimationControls } from "framer-motion"
import { LayoutDashboardIcon, Moon, Sun } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import UserDropdown from "./UserDropdown"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  idToken: IdTokenJWT | null
}

const menuItems = [
  {
    label: "Manage Subscription",
    href: "/api/subs/manage",
    icon: LayoutDashboardIcon
  }
]

const Navbar = ({ idToken: idToken_ }: NavbarProps) => {
  const { setTheme, theme } = useTheme()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const idToken = useIdToken(idToken_)
  const lineOneControls = useAnimationControls()
  const lineTwoControls = useAnimationControls()
  const lineThreeControls = useAnimationControls()
  const menuControls = useAnimationControls()

  const handleIsOpen = () => {
    if (window.innerWidth < 768) setIsOpen(!isOpen)
  }

  return (
    <nav className="sticky left-0 top-[1px] z-50 mb-8 flex h-auto w-full items-center justify-center py-6">
      <div className="flex h-full w-full max-w-8xl items-center justify-between px-8 transition-all duration-300">
        <div className="flex h-16 min-w-fit items-center justify-center rounded-[10px] border-2 border-foreground/5 bg-background-light/90 px-6 backdrop-blur">
          <Link
            href="/"
            className="flex items-center gap-6"
          >
            <Image
              src="/Logo.svg"
              className="rounded-full"
              alt="Would You Logo"
              width="30"
              height="30"
              priority
            />
            <p className="text-xl font-bold text-foreground">Would You</p>
          </Link>
        </div>
        <div
          className={`absolute flex items-center justify-center gap-6 rounded-[10px] border-2 border-foreground/5 bg-background-light/90 backdrop-blur md:static ${isOpen ? "right-0 top-0 z-10 h-screen w-screen rounded-none" : "right-7 top-6 h-16 w-16 md:w-min"} transition-all duration-300`}
        >
          <div className="hidden w-max gap-6 px-6 lg:px-10 md:flex items-center">
            <Link
              href="/commands"
              className="text-lg text-foreground/70 transition-all hover:text-foreground/90"
            >
              Commands
            </Link>
            <Link
              href="/blog"
              className="text-lg text-foreground/70 transition-all hover:text-foreground/90"
            >
              Blog
            </Link>
            <Link
              href="/vote"
              target="_blank"
              className="text-lg text-foreground/70 transition-all hover:text-foreground/90 hidden lg:block"
            >
              Vote
            </Link>
            <Link
              href="/premium"
              className="flex items-center gap-2 text-lg text-yellow-500 dark:text-yellow-500 transition-all hover:text-yellow-600 dark:hover:text-yellow-400"
            >
              Premium
              <Crown />
            </Link>
          </div>
          <button
            className={`absolute right-[1.05rem] top-[1.35rem] z-50 flex flex-col gap-[5px] md:hidden`}
            onClick={handleIsOpen}
          >
            <div
              className={`h-[2px] w-[25px] rounded-[10px] bg-foreground ${isOpen ? "translate-y-[7px] rotate-45" : ""} transition-all duration-300`}
            />
            <div
              className={`h-[2px] w-[25px] rounded-[10px] bg-foreground ${isOpen ? "opacity-0" : ""} transition-all`}
            />
            <div
              className={`h-[2px] w-[25px] rounded-[10px] bg-foreground ${isOpen ? "-translate-y-[7px] -rotate-45" : ""} transition-all duration-300`}
            />
          </button>
          <div
            className={`mb-auto flex h-full w-full flex-col items-center justify-center gap-8 p-4 text-foreground md:hidden ${isOpen ? "pointer-events-auto opacity-100 transition-all delay-150 duration-300" : "pointer-events-none opacity-0"}`}
          >
            <button className="flex items-center justify-center text-foreground/70 hover:text-foreground/90" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" /> }
            </button>
            <Link
              href="/commands"
              onClick={handleIsOpen}
              className="text-2xl text-foreground/70 transition-all hover:text-foreground/90"
            >
              Commands
            </Link>
            <Link
              href="/blog"
              onClick={handleIsOpen}
              className="text-2xl text-foreground/70 transition-all hover:text-foreground/90"
            >
              Blog
            </Link>
            <Link
              href="/vote"
              target="_blank"
              onClick={handleIsOpen}
              className="text-2xl text-foreground/70 transition-all hover:text-foreground/90"
            >
              Vote
            </Link>
            <Link
              href="/premium"
              onClick={handleIsOpen}
              className="flex items-center gap-2 text-2xl text-yellow-500 dark:text-yellow-500 transition-all hover:text-yellow-600 dark:hover:text-yellow-400"
            >
              Premium
              <Crown />
            </Link>
            {idToken ?
              <UserDropdown
                idToken={idToken}
                items={menuItems}
              />
            : <DiscordLoginButton className="h-16 rounded-[10px] px-6" />}
          </div>
        </div>
        <div className="hidden h-16 min-w-fit items-center justify-center md:flex gap-2">
          <button className="flex h-full w-auto aspect-square rounded-xl items-center justify-center text-foreground/70 hover:text-foreground/90 hover:bg-hover-light transition" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon className="w-6 h-6 sm:w-8 sm:h-8" /> : <Sun className="w-6 h-6 sm:w-8 sm:h-8" /> }
          </button>
          {idToken ?
            <UserDropdown
              idToken={idToken}
              items={menuItems}
            />
          : <DiscordLoginButton className="h-16 rounded-[10px] px-6" />}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
