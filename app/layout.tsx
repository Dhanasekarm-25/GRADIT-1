import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GRADit! College ERP AI Chatbot (Standalone)',
  description: 'Autonomous AI Chatbot for GRADit! College ERP — Attendance, Fees, Student Queries, and Reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
