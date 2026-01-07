# Database Setup Guide for Swap History & Session Management

This guide will help you set up the database tables and storage for the new features.

## Prerequisites

- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Step 1: Run SQL Migrations

Open your Supabase dashboard and navigate to the SQL Editor. Run the following SQL files in order:

### 1. Create Swap Sessions Table

```sql
-- Copy and paste contents from CREATE_SWAP_SESSIONS_TABLE.sql
```

Run the entire contents of `CREATE_SWAP_SESSIONS_TABLE.sql` file.

### 2. Create Swap History Table

```sql
-- Copy and paste contents from CREATE_SWAP_HISTORY_TABLE.sql
```

Run the entire contents of `CREATE_SWAP_HISTORY_TABLE.sql` file.

### 3. Create Message Attachments Table

```sql
-- Copy and paste contents from CREATE_MESSAGE_ATTACHMENTS_TABLE.sql
```

Run the entire contents of `CREATE_MESSAGE_ATTACHMENTS_TABLE.sql` file.

### 4. Alter Swaps Table

```sql
-- Copy and paste contents from ALTER_SWAPS_TABLE.sql
```

Run the entire contents of `ALTER_SWAPS_TABLE.sql` file.

### 5. Setup Supabase Storage

```sql
-- Copy and paste contents from SUPABASE_STORAGE_SETUP.sql
```

Run the entire contents of `SUPABASE_STORAGE_SETUP.sql` file.

## Step 2: Verify Tables

After running all migrations, verify that the tables were created successfully:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following new tables:
   - `swap_sessions`
   - `swap_history`
   - `message_attachments`
3. Check that the `swaps` table has new columns:
   - `total_hours`
   - `remaining_hours`
   - `partner_name`

## Step 3: Verify Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `message-attachments`
3. The bucket should be set to **public**

## Step 4: Test the Application

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Test the following features:
   - Navigate to a swap detail page
   - Create a session (Google Meet link should be generated)
   - Send a message in the swap chat
   - Upload a file in the chat
   - View the history tab

## Troubleshooting

### Tables Not Created

If tables are not created, check for error messages in the SQL Editor. Common issues:
- RLS policies may conflict with existing policies
- Foreign key constraints may fail if referenced tables don't exist

### Storage Bucket Issues

If the storage bucket is not created:
1. Manually create it in the Storage section
2. Set it to **public**
3. Run the RLS policies from `SUPABASE_STORAGE_SETUP.sql` separately

### Permission Errors

If you get permission errors when using the app:
- Check that RLS policies are enabled on all tables
- Verify that the authenticated user has the correct permissions
- Check the Supabase logs for detailed error messages

## Features Enabled

After successful setup, you will have:

✅ **Swap History Tracking**
- Complete activity log for each swap
- Statistics on messages, sessions, and time spent
- Filterable history view

✅ **Google Meet Sessions**
- Create sessions with auto-generated Meet links
- Track session duration
- Automatic time deduction from swap hours
- Session history with links

✅ **Dual Messaging System**
- Swap-specific chat in SwapDetail page
- General conversations in Messages page
- Context-aware message routing

✅ **File Attachments**
- Upload images and documents
- Inline image preview
- File download functionality
- Works in both swap and general chats

## Next Steps

- Test all features thoroughly
- Monitor Supabase logs for any errors
- Adjust RLS policies if needed for your specific use case
