import './globals.css'

export const metadata = {
    title: 'Tarapeza',
    description: 'QR Menu for Restaurants',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}