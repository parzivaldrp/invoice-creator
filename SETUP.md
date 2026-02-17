# Invoice Creator - Authentication Setup

## Supabase Configuration

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Get Your Project Credentials**
   - Go to Settings > API in your Supabase dashboard
   - Copy the `Project URL` and `anon public` key

3. **Set Up Environment Variables**
   Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set Up Database Tables and Policies**
   - Go to SQL Editor in your Supabase dashboard
   - Open the `supabase-setup.sql` file from this project
   - Copy and paste the entire SQL script into the SQL Editor
   - Click "Run" to execute the script
   - This will create:
     - `profiles` table for user profile data
     - Row Level Security (RLS) policies
     - Database function for secure profile creation
     - Optional trigger for auto-creating profiles

5. **Configure Authentication**
   - Go to Authentication > Settings in your Supabase dashboard
   - Enable Email confirmations (recommended)
   - Set up your site URL (e.g., `http://localhost:3000` for development)
   - Configure redirect URLs:
     - `http://localhost:3000/dashboard` (for development)
     - `https://yourdomain.com/dashboard` (for production)

## Features Implemented

### ✅ Authentication System
- **Login Page**: Email/password authentication with error handling
- **Sign Up Page**: User registration with email confirmation
- **Forgot Password**: Password reset functionality
- **Protected Routes**: Invoice generator requires authentication
- **User Dashboard**: Personalized dashboard for authenticated users

### ✅ UI Improvements
- **Toast Notifications**: Success/error feedback using react-toastify
- **Loading States**: Proper loading indicators throughout the app
- **Responsive Design**: Mobile-friendly authentication pages
- **User Status**: Navbar shows login/logout based on authentication state

### ✅ Security Features
- **Route Protection**: Unauthenticated users redirected to login
- **Session Management**: Automatic session handling with Supabase
- **Password Validation**: Client-side password confirmation
- **Email Verification**: Optional email confirmation for new accounts

## Usage

1. **For New Users**:
   - Visit the homepage → redirected to signup
   - Create account → email confirmation (if enabled)
   - Access dashboard and invoice generator

2. **For Existing Users**:
   - Click "Sign In" → login page
   - Access dashboard and invoice generator

3. **Password Reset**:
   - Click "Forgot Password" on login page
   - Enter email → receive reset link
   - Set new password

## Next Steps

1. **Database Integration**: Store invoices in Supabase database
2. **PDF Generation**: Implement actual PDF generation
3. **Email Integration**: Send invoices via email
4. **Invoice Templates**: Add more template options
5. **Client Management**: Store and manage client information
6. **Payment Integration**: Add payment processing

## Troubleshooting

- **Authentication not working**: Check your environment variables
- **Email not sending**: Verify Supabase email settings
- **Redirect issues**: Check redirect URLs in Supabase dashboard
- **CORS errors**: Ensure your domain is whitelisted in Supabase
- **"RLS policy violation" error on signup**: 
  - Make sure you've run the `supabase-setup.sql` script in your Supabase SQL Editor
  - The script sets up the necessary RLS policies and database function
  - Check that the `profiles` table exists and has the correct structure

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see your application! 