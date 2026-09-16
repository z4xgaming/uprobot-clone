export const metadata = {
  title: 'Uprobot Clone - Uptime Monitor',
  description: 'Live ping monitor with project name',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
