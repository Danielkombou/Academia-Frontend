"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The saved choice is only readable in the browser, so the server and the
  // first client render cannot know it. This reserves the trigger's exact box
  // until the provider has mounted, which keeps the header from shifting and
  // keeps the value out of markup React would have to reconcile.
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-hidden="true" tabIndex={-1}>
        <Sun className="invisible" aria-hidden="true" />
      </Button>
    );
  }

  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <DropdownMenuTrigger
            render={
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Theme" />
                }
              />
            }
          >
            <Icon aria-hidden="true" />
          </DropdownMenuTrigger>
          <TooltipContent>Theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: string) => setTheme(value)}
        >
          {/*
            closeOnClick is what closes the menu after a choice. base-ui
            defaults it to false on radio items, which suits a multi select
            filter but not a setting: without it the menu stays open with focus
            stranded on the item instead of returning to the trigger.
          */}
          <DropdownMenuRadioItem value="light" closeOnClick>
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick>
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick>
            Follow the system
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
