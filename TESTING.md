# Spyfall Game - Testing Guide

## Automated Tests (Playwright)

Run tests with:
```bash
npm install
npm test
```

Tests cover: game mode toggle, local mode (tiles, reveal, selected), online mode (create, join, leave), cookie/reconnect, and auto-reconnect.

## Game Modes

### 1. Local (Pass & Play) Mode
- **Purpose**: Single device, pass the phone around. Each player taps their number to see their role.
- **Flow**: 
  1. Select "Local (Pass & Play)" on home screen
  2. Set number of players (3-12) and locations (3-27)
  3. Click "Start Local Game"
  4. Grid of Player 1, Player 2, etc. appears
  5. Each person taps their tile to reveal role; taps again to hide before passing
  6. "End Game" returns to home

### 2. Online (Multiplayer) Mode
- **Purpose**: Multi-device play via Firebase. Supports reconnection with character preservation.
- **Flow**:
  1. Select "Online (Multiplayer)" on home screen
  2. Enter name, create or join room
  3. Lobby: configure game, start when 3+ players
  4. Game: see role, timer, locations
  5. If disconnected: return to site, switch to Online mode, click "Rejoin Game" (cookie preserves your character)

## Test Checklist

### Local Mode
- [ ] Toggle to Local mode shows correct UI (player count, location count, Start button)
- [ ] Start with 3 players - 3 tiles appear
- [ ] Start with 12 players - 12 tiles appear
- [ ] Tap tile reveals role (spy or location+role)
- [ ] Spy tile shows red styling
- [ ] Non-spy tile shows green styling with location and role
- [ ] Tap again hides role, shows "Player N"
- [ ] Exactly one spy per game
- [ ] End Game returns to home
- [ ] Location count 3-27 works
- [ ] Invalid player count (e.g. 2) is clamped to 3
- [ ] Invalid player count (e.g. 20) is clamped to 12

### Online Mode
- [ ] Toggle to Online mode shows room list, create, join
- [ ] Create room works
- [ ] Join room works (need 2 browser windows/tabs)
- [ ] Start game requires 3+ players
- [ ] All players see same game state
- [ ] Timer syncs across clients
- [ ] Host can remove players
- [ ] Leave room returns to home

### Reconnection (Online)
- [ ] Join room, start game - cookie is set
- [ ] Close tab (simulate disconnect)
- [ ] Reopen, switch to Online mode
- [ ] "Rejoin Previous Game" section appears
- [ ] Click Rejoin - returns to game with same character
- [ ] Dismiss clears rejoin option
- [ ] If removed from game, rejoin shows "You were removed"
- [ ] If room deleted, rejoin section doesn't appear (cookie cleared)

### Mode Toggle
- [ ] Switching modes preserves form state where applicable
- [ ] Local → Online → Local shows correct content each time
- [ ] No console errors when switching

## Quick Manual Test

1. **Local**: Start local game with 4 players. Tap Player 1 - see role. Tap again - hide. Verify one spy.
2. **Online**: Open in 2 tabs. Tab 1: create room "Test". Tab 2: join. Tab 1: start game. Both see roles.
3. **Rejoin**: Tab 2 close. Tab 2 reopen. Switch to Online. Click Rejoin. Tab 2 sees same role.
