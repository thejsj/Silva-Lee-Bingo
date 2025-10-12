import type React from "react"
import type { Metadata } from "next"
import { krungthep } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Silva Lee Bingo",
  description: "Interactive bingo game with photo uploads",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={krungthep.variable}>
      <body className={krungthep.className}>{children}</body>
    </html>
  )
}
