import React from 'react';
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      offset="6rem"
      icons={{
        success: (
          <div className="z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white/20 dark:ring-black/20">
            <CircleCheckIcon className="size-5 text-emerald-500 dark:text-emerald-400" strokeWidth={3} />
          </div>
        ),
        info: (
          <div className="z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white/20 dark:ring-black/20">
            <InfoIcon className="size-5 text-blue-500 dark:text-blue-400" strokeWidth={3} />
          </div>
        ),
        warning: (
          <div className="z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white/20 dark:ring-black/20">
            <TriangleAlertIcon className="size-5 text-amber-500 dark:text-amber-400" strokeWidth={3} />
          </div>
        ),
        error: (
          <div className="z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white/20 dark:ring-black/20">
            <OctagonXIcon className="size-5 text-rose-500 dark:text-rose-400" strokeWidth={3} />
          </div>
        ),
        loading: (
          <div className="z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-white/20 dark:ring-black/20">
            <Loader2Icon className="size-5 animate-spin text-zinc-500 dark:text-zinc-400" strokeWidth={3} />
          </div>
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast relative overflow-hidden group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3 group-[.toaster]:items-start group-[.toaster]:border-0 font-sans before:absolute before:-top-4 before:-left-4 before:w-20 before:h-20 before:rounded-full before:bg-white/30 before:dark:bg-black/10 before:pointer-events-none after:absolute after:-bottom-8 after:left-12 after:w-24 after:h-24 after:rounded-full after:bg-black/5 after:dark:bg-white/5 after:pointer-events-none",
          success: "group-[.toaster]:!bg-[#d1f4d9] group-[.toaster]:dark:!bg-emerald-950/80 group-[.toaster]:text-emerald-900 group-[.toaster]:dark:text-emerald-100",
          error: "group-[.toaster]:!bg-[#fcd7d7] group-[.toaster]:dark:!bg-rose-950/80 group-[.toaster]:text-rose-900 group-[.toaster]:dark:text-rose-100",
          info: "group-[.toaster]:!bg-[#d6e8ff] group-[.toaster]:dark:!bg-blue-950/80 group-[.toaster]:text-blue-900 group-[.toaster]:dark:text-blue-100",
          warning: "group-[.toaster]:!bg-[#faecd1] group-[.toaster]:dark:!bg-amber-950/80 group-[.toaster]:text-amber-900 group-[.toaster]:dark:text-amber-100",
          title: "group-[.toast]:font-bold group-[.toast]:text-[15px] z-10 relative",
          description: "group-[.toast]:opacity-80 group-[.toast]:font-medium mt-1 leading-relaxed inline-block group-[.toast]:text-[13px] z-10 relative",
          actionButton: "group-[.toast]:bg-zinc-900 group-[.toast]:text-white group-[.toast]:dark:bg-white group-[.toast]:dark:text-zinc-900 group-[.toast]:font-bold group-[.toast]:rounded-xl font-sans group-[.toast]:px-4 group-[.toast]:py-2 z-10 relative",
          cancelButton: "group-[.toast]:bg-black/5 group-[.toast]:dark:bg-white/10 group-[.toast]:text-current font-bold rounded-xl font-sans group-[.toast]:px-4 group-[.toast]:py-2 z-10 relative",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
