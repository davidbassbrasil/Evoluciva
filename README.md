# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure environment variables
# Copy .env.local.example to .env.local and add your Supabase credentials
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Step 5: Set up Supabase database
# Run the SQL file in your Supabase SQL Editor:
# supabase/profiles_and_policies.sql

# Step 6: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Authentication & Database)

## Supabase Setup

This project uses Supabase for authentication and user management.

### Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project

### Configuration Steps

1. **Get your credentials:**
   - Go to Project Settings → API
   - Copy the Project URL and anon/public key

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Run the database setup:**
   - Open Supabase Studio → SQL Editor
   - Copy and run the contents of `supabase/profiles_and_policies.sql`
   - This will create the `profiles` table and RLS policies

4. **Create an admin user (optional):**
   ```sql
   -- After creating a user via the app, promote them to admin:
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your_admin@example.com';
   ```

### Features

- **Student Registration:** Full profile creation with address, CPF, WhatsApp
- **Admin Panel:** Manage students, courses, and content
- **Role-based Access:** RLS policies ensure students can only see their data
- **Secure Authentication:** Powered by Supabase Auth

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
