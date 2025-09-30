import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getAuthOptions() {
    return authOptions;
}