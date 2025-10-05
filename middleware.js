export { default } from 'next-auth/middleware';

export const config = {
    matcher: [
        '/patient/:path*',
        '/worker/:path*',
        '/seller/:path*',
        '/chat/:path*',
        '/api/messages/:path*',
        '/api/appointments/:path*',
        '/api/notifications/:path*',
        '/api/users/:path*',
        '/api/medicines/:path*',
        '/api/cart/:path*',
        '/api/orders/:path*'
    ]
};