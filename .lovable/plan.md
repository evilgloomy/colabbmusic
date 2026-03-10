

## Store Threads Token & Test Sync

### Steps

1. **Store the secret**: Save `THREADS_ACCESS_TOKEN` as a backend secret using the provided token value.

2. **Test the sync**: Invoke the `sync-threads-posts` edge function to verify it successfully fetches posts from Cola's Threads account, enhances them with AI, and inserts them into the `stories` table.

3. **Verify results**: Check the `stories` table to confirm posts were synced correctly, then verify the Story page displays them.

No code changes needed — the edge function and database are already set up. This is purely configuration + testing.

