import { REWARDS } from './rewards.js';

// ============================================
// CHECK-IN MESSAGES
// ============================================

/**
 * Success message when streak continues normally
 */
export function checkinSuccess(username, bebits, streak) {
    return `🐍 Sssalutations, **${username}**! Beboa has marked your presence...

**+1 Bebit earned!**
Current Balance: **${bebits} Bebits**
Streak: **${streak} days** 🔥

Hehehe... another day closer to your rewards, little mortal~`;
}

/**
 * Success message when streak is recovered (within 48-72 hours)
 */
export function checkinRecovered(username, bebits, streak) {
    return `🐍 Hisss... cutting it close, aren't we **${username}**?

Beboa will let it slide THIS time. Your streak lives... barely.

**+1 Bebit earned!**
Current Balance: **${bebits} Bebits**
Streak: **${streak} days** (recovered!)

Don't test my patience again~ 🐍`;
}

/**
 * Success message when streak resets (> 72 hours)
 */
export function checkinReset(username, bebits, oldStreak) {
    return `🐍 Oh my, oh my... look who finally remembered Beboa exists!

Your streak of **${oldStreak} days** has turned to dust. Pathetic~
But Beboa is feeling generous... your **${bebits} Bebits** remain.

**+1 Bebit earned!**
Current Balance: **${bebits} Bebits**
Streak: **1 day** (reset)

Start crawling again, little one~ 🐍`;
}

/**
 * Message when user is still on cooldown
 */
export function checkinCooldown(username, bebits, streak, hours, minutes) {
    return `🐍 Patience, greedy one!

You've already claimed your Bebit today.
Come back in **${hours}h ${minutes}m**.

Current Balance: **${bebits} Bebits**
Streak: **${streak} days**

Beboa doesn't do charity~ 🐍`;
}

/**
 * First time check-in message
 */
export function checkinFirst(username, bebits) {
    return `🐍 Sssalutations, **${username}**! A new mortal joins Bebe's domain...

Beboa has marked your first presence. Don't disappoint us~

**+1 Bebit earned!**
Current Balance: **${bebits} Bebits**
Streak: **1 day** 🔥

Come back every day to build your streak, little one~`;
}

// ============================================
// BALANCE MESSAGES
// ============================================

/**
 * Get conditional message based on bebits balance tier
 */
function getBalanceTierMessage(bebits) {
    if (bebits <= 10) {
        return "Just getting started? How adorable~";
    } else if (bebits <= 50) {
        return "Hm, showing some dedication I see...";
    } else if (bebits <= 100) {
        return "Beboa is mildly impressed. Mildly.";
    } else if (bebits <= 200) {
        return "Oho~ Someone's been a good little pet!";
    } else if (bebits <= 500) {
        return "Now THIS is commitment! Bebe will be pleased~";
    } else {
        return "...You actually did it. Beboa bows to your obsession. 🐍";
    }
}

/**
 * Balance display message
 */
export function balanceDisplay(bebits, streak, totalCheckins) {
    const tierMessage = getBalanceTierMessage(bebits);

    return `🐍 *Beboa checks the ledger*

**Bebits:** ${bebits}
**Streak:** ${streak} days
**Total Check-ins:** ${totalCheckins}

${tierMessage}`;
}

// ============================================
// LEADERBOARD MESSAGES
// ============================================

/**
 * Format leaderboard position with medal or number
 */
function formatPosition(index, user, client) {
    const medals = ['🥇', '🥈', '🥉'];
    const position = index + 1;
    const prefix = medals[index] || `${position}.`;

    // For top 3, show streak
    if (index < 3) {
        return `${prefix} <@${user.discord_id}> - **${user.bebits} Bebits** (${user.current_streak} day streak)`;
    }

    return `${prefix} <@${user.discord_id}> - **${user.bebits} Bebits**`;
}

/**
 * Build leaderboard description
 */
export function buildLeaderboardDescription(topUsers, userRank, userBebits, userId) {
    if (topUsers.length === 0) {
        return "No one has earned Bebits yet... pathetic~\n\nBe the first to claim your glory!";
    }

    let description = topUsers
        .map((user, index) => formatPosition(index, user))
        .join('\n');

    // Add user's own rank if not in top 10
    const isInTop10 = topUsers.some(u => u.discord_id === userId);
    if (!isInTop10 && userRank > 0) {
        description += `\n\n**Your Rank:** #${userRank} with ${userBebits} Bebits`;
    }

    return description;
}

/**
 * Leaderboard footer
 */
export const LEADERBOARD_FOOTER = "Who will prove their devotion to Bebe? Hehehehe~ 🐍";

// ============================================
// SHOP MESSAGES
// ============================================

/**
 * Build shop display description
 */
export function buildShopDescription(userBebits) {
    let description = `⚠️ **DISCLAIMER: PLEASE READ THE GUIDE OF WHAT YOU GET WITH EACH REWARD!**
So that it's clear to you! You get what you get..... no refunds ⚠️

**Your Balance:** ${userBebits} Bebits

━━━━━━━━━━━━━━━━━━━━━━━━

`;

    // Add all rewards
    REWARDS.forEach(reward => {
        description += `${reward.emoji} **${reward.name}** — ${reward.cost} Bebit${reward.cost !== 1 ? 's' : ''}\n`;
    });

    description += `
━━━━━━━━━━━━━━━━━━━━━━━━

Select a reward below to redeem~`;

    return description;
}

/**
 * Confirmation prompt message
 */
export function confirmRedemption(rewardName, cost, remainingBalance) {
    return `🐍 **Confirm Redemption?**

You are about to redeem:
**${rewardName}** for **${cost} Bebits**

Your balance after: **${remainingBalance} Bebits**

⚠️ **This action cannot be undone!**`;
}

/**
 * Successful redemption message (to user)
 */
export function redemptionSuccess(rewardName, cost, remainingBalance) {
    return `🐍 **Redemption Complete!**

You have successfully redeemed:
**${rewardName}** for **${cost} Bebits**

Remaining Balance: **${remainingBalance} Bebits**

Beboa has notified Bebe~ Your reward awaits, mortal~`;
}

/**
 * Redemption cancelled message
 */
export function redemptionCancelled() {
    return `🐍 Hmph... cold feet, mortal?

Your redemption has been cancelled.
Your Bebits remain untouched.

Come back when you've gathered your courage~`;
}

/**
 * Format notification for #beboas-command-center
 */
export function buildRedemptionNotification(reward, userMention, userTag, remainingBalance, adminRoleId) {
    const notificationText = reward.notification.replace('{user}', userMention);

    return `━━━━━━━━━━━━━━━━━━━━━━━━
🐍 **REWARD CLAIMED** 🐍
━━━━━━━━━━━━━━━━━━━━━━━━

<@&${adminRoleId}> ${notificationText}

**Reward:** ${reward.emoji} ${reward.name}
**Cost:** ${reward.cost} Bebits
**User:** ${userMention} (${userTag})
**Remaining Balance:** ${remainingBalance} Bebits

━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ============================================
// ERROR MESSAGES
// ============================================

/**
 * Insufficient bebits error
 */
export function insufficientBebits(cost, balance) {
    return `🐍 Oh? Trying to buy what you can't afford?

You need **${cost} Bebits** but only have **${balance}**.
Keep checking in, greedy one~`;
}

/**
 * Wrong channel error
 */
export function wrongChannel(correctChannelId) {
    return `🐍 Not here, foolish mortal!

Use this command in <#${correctChannelId}>.
Beboa has rules~`;
}

/**
 * Generic database error
 */
export function databaseError() {
    return `🐍 Hisss... something went wrong in Beboa's lair.

Try again in a moment, little one. If this persists,
poke the mortals in charge~`;
}

/**
 * Button already processing / spam protection
 */
export function alreadyProcessing() {
    return `🐍 Patience! Beboa is already processing your request...

Don't click so fast, eager one~`;
}

/**
 * Interaction expired
 */
export function interactionExpired() {
    return `🐍 Too slow, mortal! This interaction has expired.

Use the command again if you still wish to proceed~`;
}

// ============================================
// ADMIN MESSAGES
// ============================================

/**
 * Admin: Bebits added
 */
export function adminBebitsAdded(userMention, amount, newBalance) {
    return `✅ Added **${amount} Bebits** to ${userMention}
New balance: **${newBalance} Bebits**`;
}

/**
 * Admin: Bebits removed
 */
export function adminBebitsRemoved(userMention, amount, newBalance) {
    return `✅ Removed **${amount} Bebits** from ${userMention}
New balance: **${newBalance} Bebits**`;
}

/**
 * Admin: Bebits set
 */
export function adminBebitsSet(userMention, amount, oldBalance) {
    return `✅ Set ${userMention}'s balance to **${amount} Bebits**
Previous balance: **${oldBalance} Bebits**`;
}

/**
 * Admin: Streak reset
 */
export function adminStreakReset(userMention, oldStreak, bebits) {
    return `✅ Reset ${userMention}'s streak to **0**
Previous streak: **${oldStreak} days**
(Bebits untouched: **${bebits}**)`;
}

export default {
    checkinSuccess,
    checkinRecovered,
    checkinReset,
    checkinCooldown,
    checkinFirst,
    balanceDisplay,
    buildLeaderboardDescription,
    LEADERBOARD_FOOTER,
    buildShopDescription,
    confirmRedemption,
    redemptionSuccess,
    redemptionCancelled,
    buildRedemptionNotification,
    insufficientBebits,
    wrongChannel,
    databaseError,
    alreadyProcessing,
    interactionExpired,
    adminBebitsAdded,
    adminBebitsRemoved,
    adminBebitsSet,
    adminStreakReset
};
