import './globals.css';

export const metadata = {
  title: 'MeetFlow',
  description: 'Video conferencing with recording',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
