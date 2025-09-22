export { default } from 'next-auth/middleware';

export const config = {
    matcher: [
        '/patient/:path*',
        '/worker/:path*',
        '/chat/:path*',
        '/api/messages/:path*',
        '/api/appointments/:path*',
        '/api/notifications/:path*',
        '/api/users/:path*'
    ]
};