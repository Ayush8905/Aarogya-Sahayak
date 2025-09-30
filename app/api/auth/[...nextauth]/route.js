import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                role: { label: 'Role', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Missing credentials');
                }

                try {
                    const connection = await connectDB();

                    if (!connection) {
                        // Allow demo login when database is not available
                        if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
                            return {
                                id: 'demo-user',
                                email: 'demo@example.com',
                                name: 'Demo User',
                                role: credentials.role || 'patient',
                                profileImage: null
                            };
                        }
                        throw new Error('Database not available. Use demo@example.com / demo123 for testing');
                    }

                    const user = await User.findOne({
                        email: credentials.email.toLowerCase()
                    });

                    if (!user) {
                        throw new Error('No user found with this email');
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        throw new Error('Invalid password');
                    }

                    if (!user.isActive) {
                        throw new Error('Account is deactivated');
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        profileImage: user.profileImage
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    throw new Error(error.message || 'Authentication failed');
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
        signOut: '/'
    },
    events: {
        async signOut(message) {
            // Clean up any additional data if needed
            console.log('User signed out:', message.token?.email);
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };