import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Carolina Alfaro | Orfebrería',description:'Un encuentro entre la materia, las manos y las historias. Descubre el universo de Carolina Alfaro Orfebrería.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
