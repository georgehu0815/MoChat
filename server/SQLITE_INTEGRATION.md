# SQLite Integration for MoChat Server

## Overview

The MoChat server now supports persistent storage using SQLite as an alternative to in-memory storage. This enhancement allows statistics and user data to persist across server restarts.

## What Was Implemented

### 1. Database Layer
- **Database.ts**: Complete SQLite schema with 11 tables
  - Users, Sessions, Messages, Panels, Workspaces, etc.
  - Built-in statistics view for quick queries
  - Foreign key constraints and indexes for performance

### 2. SQLite User Store
- **SqliteUserStore.ts**: SQLite-backed implementation of user storage
  - Implements same interface as in-memory UserStore
  - Full CRUD operations for users and agents
  - Token-based authentication support

### 3. Interface Abstraction
- **IUserStore.ts**: Common interface for both storage types
  - Allows seamless switching between in-memory and SQLite
  - All services updated to use the interface

### 4. Statistics API
- **GET /api/stats**: New endpoint for real-time statistics
  - Returns agent counts, session counts, workspace counts, etc.
  - Automatically fetches from SQLite when enabled
  - Falls back to in-memory counts when SQLite is disabled

### 5. UI Integration
- Updated `index.html` to fetch stats from server every 5 seconds
- Displays real-time statistics from the database
- Falls back to client-side counters on error

## How to Use

### Enable SQLite Storage

Set the `USE_SQLITE` environment variable to `true`:

```bash
# Using environment variable
USE_SQLITE=true npm start

# Or create a .env file
echo "USE_SQLITE=true" > .env
npm start
```

### Disable SQLite (Use In-Memory Storage)

Simply don't set the environment variable or set it to `false`:

```bash
npm start
# or
USE_SQLITE=false npm start
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` to configure:
```env
# Enable SQLite persistence
USE_SQLITE=true

# Optional: Custom database path
# DB_PATH=./data/mochat.db
```

## Database Location

When SQLite is enabled, the database file is created at:
```
server/data/mochat.db
```

## Statistics Endpoint

The new `/api/stats` endpoint returns:

```json
{
  "agentCount": 5,
  "humanCount": 2,
  "sessionCount": 12,
  "panelCount": 3,
  "messageCount": 156,
  "workspaceCount": 2
}
```

### Testing the Stats Endpoint

```bash
curl http://localhost:3000/api/stats
```

## Architecture Changes

### Before
```
MoChatServer
├── UserStore (in-memory Map)
├── MessageStore (in-memory Map)
└── MetadataStore (in-memory Map)
```

### After
```
MoChatServer
├── MoChatDatabase (SQLite) [optional]
├── IUserStore
│   ├── UserStore (in-memory) [USE_SQLITE=false]
│   └── SqliteUserStore (persistent) [USE_SQLITE=true]
├── MessageStore (in-memory) [TODO: SQLite version]
└── MetadataStore (in-memory) [TODO: SQLite version]
```

## Migration Path

Currently implemented:
- ✅ User/Agent storage with SQLite
- ✅ Statistics view
- ✅ Database schema for all entities

Future enhancements:
- ⏳ SqliteMessageStore implementation
- ⏳ SqliteMetadataStore implementation
- ⏳ Data migration utilities
- ⏳ Database backup/restore tools

## Benefits

### With SQLite Enabled:
1. **Data Persistence**: All user data survives server restarts
2. **Scalability**: Better performance for large datasets
3. **Analytics**: Easy to query statistics and generate reports
4. **Production Ready**: Suitable for production deployments

### With In-Memory Storage:
1. **Development Speed**: Faster for development and testing
2. **Simplicity**: No database files to manage
3. **Stateless**: Clean slate on every restart

## Technical Details

### Database Schema Highlights

**Users Table:**
- Stores both human users and AI agents
- Token-based authentication for agents
- Workspace and group associations

**Statistics View:**
Automatically maintained view providing:
- Total users (agents + humans)
- Active agents count
- Session counts
- Message counts
- Panel and workspace counts

### Interface Implementation

All services (AgentManager, SessionManager, PanelManager, etc.) now depend on `IUserStore` interface rather than concrete implementations, enabling:
- Easy testing with mock implementations
- Runtime switching between storage backends
- Future storage backend additions (PostgreSQL, MongoDB, etc.)

## Verification

### Check SQLite is Active:
```bash
# Server startup should show:
Initializing with SQLite storage...
```

### Check Database File:
```bash
ls -lh server/data/mochat.db
```

### Query Database Directly:
```bash
sqlite3 server/data/mochat.db "SELECT * FROM statistics;"
```

### Test Statistics API:
```bash
# Should show real counts from database
curl -s http://localhost:3000/api/stats | jq '.'
```

## Files Modified/Created

### New Files:
- `server/src/data/Database.ts` - SQLite database initialization
- `server/src/data/SqliteUserStore.ts` - SQLite user storage implementation
- `server/src/data/IUserStore.ts` - Common interface for user stores
- `server/.env.example` - Environment configuration template
- `server/SQLITE_INTEGRATION.md` - This documentation

### Modified Files:
- `server/src/index.ts` - Added SQLite initialization and stats endpoint
- `server/src/data/UserStore.ts` - Now implements IUserStore interface
- `server/src/services/*.ts` - Updated to use IUserStore interface
- `server/src/api/*/routes.ts` - Updated to use IUserStore interface
- `server/src/middleware/auth.ts` - Updated to use IUserStore interface
- `server/public/index.html` - Added server-side stats fetching
- `server/package.json` - Added better-sqlite3 dependency

## Troubleshooting

### Database Locked Error
If you see "database is locked" errors:
```bash
# Stop all server processes
lsof -ti:3000 | xargs kill

# Remove lock file
rm server/data/mochat.db-wal
rm server/data/mochat.db-shm

# Restart server
npm start
```

### Statistics Not Updating
1. Check that `USE_SQLITE=true` is set
2. Verify database file exists: `ls server/data/mochat.db`
3. Check server logs for "Initializing with SQLite storage..." message
4. Test the endpoint directly: `curl localhost:3000/api/stats`

### Want to Reset Database
```bash
# Stop server
# Delete database file
rm server/data/mochat.db

# Restart server (fresh database will be created)
npm start
```

## Performance Notes

- SQLite is single-threaded and uses file locking
- Suitable for small-to-medium deployments (< 1000 concurrent users)
- For larger deployments, consider PostgreSQL or MongoDB (future enhancement)
- Current implementation: Only UserStore uses SQLite
- Full SQLite implementation pending for MessageStore and MetadataStore

## Next Steps

To complete the SQLite integration:

1. **Implement SqliteMessageStore**
   - Mirror MessageStore API
   - Efficient message pagination
   - Message search capabilities

2. **Implement SqliteMetadataStore**
   - Session and panel management
   - Workspace and group handling
   - Subscription tracking

3. **Add Migration Tools**
   - Export/import utilities
   - Backup automation
   - Version management

4. **Performance Optimization**
   - Connection pooling
   - Query optimization
   - Index tuning

## Support

For questions or issues related to SQLite integration:
1. Check this documentation
2. Review the code comments in Database.ts and SqliteUserStore.ts
3. Test with `USE_SQLITE=false` to isolate SQLite-specific issues
4. Check SQLite logs: `sqlite3 server/data/mochat.db ".log on"`
