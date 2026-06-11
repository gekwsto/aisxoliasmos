import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: 'ADMIN' | 'EDITOR';
    };
  }

  interface User {
    role: 'ADMIN' | 'EDITOR';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'ADMIN' | 'EDITOR';
  }
}
