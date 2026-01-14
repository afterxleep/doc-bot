---
title: Alpha Version Expiration Security & Implementation
description: Comprehensive security documentation for alpha version expiration with hash verification
keywords: ["alpha","expiration","security","hash","SHA-256","tamper","verification","30-day","timer","globalState"]
---

# Alpha Version Expiration Security & Implementation

## Overview
FlowDeck's alpha version expiration system ensures alpha testers use the latest version by enforcing a 30-day expiration period with SHA-256 hash verification for tamper detection.

## Core Implementation

### Architecture Components
- **ExpirationManager** (`src/expiration/manager.ts`) - Core expiration logic with SHA-256 hash verification
- **Activation Integration** (`src/activate.ts`) - Blocks activation when expired
- **Hash Verification** - Detects and prevents tampering with expiration data

### Storage Format
```typescript
interface VersionInstallInfo {
  version: string;
  installedAt: number;  // timestamp in milliseconds
  hash?: string;        // SHA-256 hash for tamper detection
}
```
- **Location**: VSCode globalState API
  - macOS/Linux: `~/.config/Code/User/globalStorage/afterxleep.flowdeck/`
  - Windows: `%APPDATA%\Code\User\globalStorage\afterxleep.flowdeck\`

## Security Features

### SHA-256 Hash Verification
```typescript
// Hash generation with salt
const hash = crypto.createHash('sha256')
  .update(`${version}:${installedAt}:FlowDeck-Alpha-2024-Expiration`)
  .digest('hex');

// Verification on every activation
if (!verifyHash(storedInfo)) {
  // Tampered data detected - force expiration
  return true;
}
```

### Tamper Detection Scenarios
1. **Missing Hash**: Old format or tampered data → Force expiration
2. **Invalid Hash**: Hash doesn't match computed value → Force expiration
3. **Modified Timestamp**: User changed installation date → Force expiration
4. **Valid Hash**: Normal operation continues

### Security Level: ⭐⭐⭐☆☆
- ✅ SHA-256 cryptographic hash function
- ✅ Salt-based hashing prevents rainbow tables
- ✅ Automatic expiration on tamper detection
- ✅ No network calls or privacy concerns
- ⚠️ Can be bypassed by clearing state or reinstalling
- ❌ Not suitable for licensing/paid features

## Implementation Details

### Key Methods

#### `generateHash(version: string, installedAt: number): string`
- Creates SHA-256 hash with salt
- Salt: `FlowDeck-Alpha-2024-Expiration`
- Used when storing new version info

#### `verifyHash(info: VersionInstallInfo): boolean`
- Validates stored hash against computed hash
- Returns false if hash missing or invalid
- Called on every extension activation

#### `initializeVersionTracking()`
- Stores hash with new installations
- Verifies existing installations
- Forces expiration on tamper detection

#### `isExpired()`
- First verifies hash integrity
- Returns true if tampered
- Then checks 30-day expiration

## Testing

### Automated Tests (50+ tests)
```bash
# Run hash verification tests
npm run jest -- tests/expiration/manager.test.ts

# Run all expiration tests  
npm run jest -- tests/expiration/

# Full test suite (1054 tests)
npm run jest
```

### Manual Tamper Testing
1. Install extension (creates hash)
2. Edit globalState to change timestamp
3. Reload extension
4. Should detect tampering and expire

### Test Coverage
- Hash missing detection
- Invalid hash detection
- Timestamp tampering detection
- Valid hash acceptance
- Hash in forceExpire/resetTimer
- Backwards compatibility

## User Experience

### Timeline
- **Days 1-23**: Normal operation
- **Days 24-30**: Status bar warning (last 7 days)
- **Days 28-30**: Dialog warning (last 3 days)
- **Day 31+**: Complete blocking, error dialog

### Tamper Detection UX
- Immediate expiration on tampering
- Error dialog directing to marketplace
- No way to extend by editing data

## Bypass Methods & Mitigations

### Still Possible
1. **Clear GlobalState**: Delete all extension data → Resets timer
2. **Uninstall/Reinstall**: Clears state → Fresh 30 days
3. **Multiple VS Code instances**: Different storage locations

### Now Prevented
1. ~~Edit timestamp in storage~~ → Hash verification detects
2. ~~Modify version string~~ → Hash verification detects
3. ~~Change expiration date~~ → Hash verification detects

## Performance Impact
- **Startup overhead**: < 1ms for hash verification
- **Memory**: Minimal (one extra string field)
- **CPU**: Single SHA-256 computation on activation

## Privacy & Transparency
- **No network calls**: All verification happens locally
- **No personal data**: Only version and timestamp stored
- **Open source**: Implementation fully visible
- **User control**: Can uninstall/reinstall if needed

## Future Enhancements (Not Implemented)
- Server-side verification for stronger security
- Multiple storage locations for redundancy
- Grace period for offline users
- Integration with VS Code auto-update

## Important Notes
⚠️ **Testing flag**: Never commit `_testExpiration: true` in package.json
⚠️ **Production**: Only use `isAlphaVersion` flag for releases
⚠️ **Timer reset**: Each new version resets 30-day timer
⚠️ **Not for licensing**: This is for alpha testing, not paid features