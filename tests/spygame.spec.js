// @ts-check
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
});

test.describe('Game Mode Toggle', () => {
  test('starts in Local mode', async ({ page }) => {
    await expect(page.locator('#localModeBtn')).toHaveClass(/active/);
    await expect(page.locator('#localModeContent')).toBeVisible();
    await expect(page.locator('#startLocalGameBtn')).toBeVisible();
  });

  test('switches to Online mode', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await expect(page.locator('#onlineModeBtn')).toHaveClass(/active/);
    await expect(page.locator('#usernameInput')).toBeVisible();
    await expect(page.locator('#roomList')).toBeVisible();
  });

  test('switches back to Local mode', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await page.click('#localModeBtn');
    await expect(page.locator('#localModeBtn')).toHaveClass(/active/);
    await expect(page.locator('#startLocalGameBtn')).toBeVisible();
  });
});

test.describe('Local Mode', () => {
  test('starts local game with 4 players', async ({ page }) => {
    await page.fill('#localPlayerCount', '4');
    await page.click('#startLocalGameBtn');
    
    const tiles = page.locator('.player-tile');
    await expect(tiles).toHaveCount(4);
  });

  test('reveals role when tile is clicked', async ({ page }) => {
    await page.click('#startLocalGameBtn');
    
    const firstTile = page.locator('.player-tile').first();
    await firstTile.click();
    
    await expect(firstTile).toHaveClass(/revealed/);
    const content = await firstTile.textContent();
    expect(content).toMatch(/SPY|Tap to hide|Manager|Captain|Passenger/i);
  });

  test('marks tile as selected after hide', async ({ page }) => {
    await page.click('#startLocalGameBtn');
    
    const firstTile = page.locator('.player-tile').first();
    await firstTile.click();
    await expect(firstTile).toHaveClass(/revealed/);
    
    await firstTile.click();
    await expect(firstTile).toHaveClass(/selected/);
    await expect(firstTile).toContainText('Viewed');
  });

  test('selected tile has pointer-events disabled', async ({ page }) => {
    await page.click('#startLocalGameBtn');
    
    const firstTile = page.locator('.player-tile').first();
    await firstTile.click();
    await firstTile.click();
    
    await expect(firstTile).toHaveClass(/selected/);
    const pointerEvents = await firstTile.evaluate(el => getComputedStyle(el).pointerEvents);
    expect(pointerEvents).toBe('none');
  });

  test('End Game returns to home', async ({ page }) => {
    await page.click('#startLocalGameBtn');
    await expect(page.locator('#localGameScreen')).toBeVisible();
    
    page.on('dialog', d => d.accept());
    await page.click('#endLocalGameBtn');
    
    await expect(page.locator('#homeScreen')).toBeVisible();
    await expect(page.locator('#localGameScreen')).toBeHidden();
  });
});

test.describe('Online Mode - UI', () => {
  test('Create button disabled without username', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await expect(page.locator('#createRoomBtn')).toBeDisabled();
  });

  test('Create button enabled with username', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await page.fill('#usernameInput', 'TestPlayer');
    await expect(page.locator('#createRoomBtn')).toBeEnabled();
  });

  test('room list loads', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await page.waitForTimeout(3000);
    const roomList = page.locator('#roomList');
    await expect(roomList).toBeVisible();
    const text = await roomList.textContent();
    expect(text).toMatch(/No rooms available|Loading|room|player/i);
  });

  test('create room and reach lobby', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await page.fill('#usernameInput', 'HostPlayer');
    await page.click('#createRoomBtn');
    await page.waitForTimeout(3000);
    await expect(page.locator('#lobbyScreen')).toBeVisible();
    await expect(page.locator('#playerList')).toContainText('HostPlayer');
  });

  test('leave room clears cookie and returns to home', async ({ page, context }) => {
    await page.click('#onlineModeBtn');
    await page.fill('#usernameInput', 'LeaveTestPlayer');
    await page.click('#createRoomBtn');
    await page.waitForTimeout(3000);
    await expect(page.locator('#lobbyScreen')).toBeVisible();
    
    await page.click('#leaveLobbyBtn');
    await expect(page.locator('#lobbyScreen')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('#homeScreen')).toBeVisible();
    
    const cookies = await context.cookies();
    const spygameCookie = cookies.find(c => c.name === 'spygame_player');
    expect(spygameCookie).toBeUndefined();
  });
});

test.describe('Cookie and Reconnect', () => {
  test('no reconnect UI when no cookie', async ({ page }) => {
    await page.click('#onlineModeBtn');
    await page.waitForTimeout(1000);
    const rejoinSection = page.locator('#rejoinSection');
    await expect(rejoinSection).toHaveClass(/hidden/);
  });

  test('init shows home when no cookie', async ({ page }) => {
    await expect(page.locator('#homeScreen')).toBeVisible();
    await expect(page.locator('#lobbyScreen')).toBeHidden();
  });

  test('invalid cookie falls back to home', async ({ page, context }) => {
    await page.evaluate(() => localStorage.setItem('spygame_player', JSON.stringify({
      roomId: 'room_nonexistent_123',
      peerId: 'user_fake_123',
      name: 'Test',
      ts: Date.now()
    })));
    await context.addCookies([{
      name: 'spygame_player',
      value: encodeURIComponent(JSON.stringify({
        roomId: 'room_nonexistent_123',
        peerId: 'user_fake_123',
        name: 'Test',
        ts: Date.now()
      })),
      domain: 'localhost',
      path: '/',
    }]);
    await page.goto('/');
    await page.waitForTimeout(5000);
    await expect(page.locator('#homeScreen')).toBeVisible();
    await expect(page.locator('#startLocalGameBtn')).toBeVisible();
  });

  test('auto-reconnect with valid cookie returns to lobby', async ({ page, context }) => {
    await page.click('#onlineModeBtn');
    await page.fill('#usernameInput', 'ReconnectTest');
    await page.click('#createRoomBtn');
    await page.waitForTimeout(3000);
    await expect(page.locator('#lobbyScreen')).toBeVisible();
    
    const cookies = await context.cookies();
    const spygameCookie = cookies.find(c => c.name === 'spygame_player');
    expect(spygameCookie).toBeDefined();
    
    await page.goto('/');
    await page.waitForTimeout(4000);
    await expect(page.locator('#lobbyScreen')).toBeVisible();
    await expect(page.locator('#playerList')).toContainText('ReconnectTest');
  });
});

test.describe('Local mode - exact one spy', () => {
  test('exactly one spy among players', async ({ page }) => {
    await page.fill('#localPlayerCount', '6');
    await page.click('#startLocalGameBtn');
    
    let spyCount = 0;
    const tiles = page.locator('.player-tile');
    for (let i = 0; i < 6; i++) {
      await tiles.nth(i).click();
      const text = await tiles.nth(i).textContent();
      if (text.includes('SPY')) spyCount++;
      await tiles.nth(i).click();
    }
    expect(spyCount).toBe(1);
  });
});
