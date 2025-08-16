"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Trophy,
  Info,
  Volume2,
  VolumeX,
  Gamepad2,
} from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/high-scores", label: "High Scores", icon: Trophy },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              Play Hive
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden h-[100vh] fade-in-up">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card rounded-lg mt-2 border border-border">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-card-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
