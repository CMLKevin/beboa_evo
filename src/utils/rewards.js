/**
 * All available rewards in Beboa's Reward Emporium
 * Each reward has a unique id, display name, cost in Bebits, emoji, and notification message
 */
export const REWARDS = [
    {
        id: 'bite',
        name: 'A Bite From Bebe',
        cost: 1,
        emoji: '🦷',
        notification: 'a reward has been claimed by {user}! Time to bite them brutally!'
    },
    {
        id: 'praise',
        name: 'Praise From Bebe',
        cost: 2,
        emoji: '✨',
        notification: 'a reward has been claimed by {user}! Aww this puppy wants to be praised!'
    },
    {
        id: 'degrade',
        name: 'Degradation From Bebe',
        cost: 5,
        emoji: '😈',
        notification: "a reward has been claimed by {user}! Time to degrade them! Hehe don't hold back on this loser, Bebe!"
    },
    {
        id: 'task',
        name: 'Simple Task/Punishment',
        cost: 25,
        emoji: '📋',
        notification: 'a reward has been claimed by {user}! Hahaha this doggy wants a treat, I wonder what you will come up with, Bebe!'
    },
    {
        id: 'scam',
        name: 'Bebe Scam',
        cost: 50,
        emoji: '🎰',
        description: 'You get nothing, get scammed, nerd.... I will laugh at you super hard',
        notification: 'a reward has been claimed by {user}! HAHAHAHA BEBE LOOK! THIS DORK JUST WASTED THEIR TIME!!! AHAHAHA!!!'
    },
    {
        id: 'toy_5',
        name: 'Control Toy (5 min)',
        cost: 100,
        emoji: '🎮',
        notification: 'a reward has been claimed by {user}! Ohh wow...A very patient one... Hehe I hope you enjoy, Bebe!'
    },
    {
        id: 'voice_short',
        name: 'Voice Message (1-2 min)',
        cost: 120,
        emoji: '🎤',
        notification: 'a reward has been claimed by {user}! Heheh not bad, dork! I am even impressed! Bebe! Look!'
    },
    {
        id: 'fame',
        name: '15 Minutes of Fame',
        cost: 150,
        emoji: '⭐',
        notification: "a reward has been claimed by {user}! Tsk...attention from Bebe!? Yeah..yeah whatever... I guess you earned it, dork...."
    },
    {
        id: 'toy_15',
        name: 'Control Toy (15 min)',
        cost: 200,
        emoji: '🎮',
        notification: "a reward has been claimed by {user}! 15 minutes with Bebe's toy!?!? WHAT??!?!?"
    },
    {
        id: 'voice_long',
        name: 'Voice Message (5-10 min)',
        cost: 360,
        emoji: '🎤',
        notification: "a reward has been claimed by {user}! 5 more days and you spent a whole year on this.....do you have anything else to do with your life? AHAHA you earned it! Bebe! You have a really loyal pet here!"
    },
    {
        id: 'gf_day',
        name: 'GF For A Day',
        cost: 500,
        emoji: '💕',
        notification: 'a reward has been claimed by {user}! CODE RED!! I REPEAT!!! BEBE....WE HAVE CODE RED!!! WAKE UP!!!! THIS NERD ALMOST SPENT TWO YEARS TO BE YOUR DOG!!!! HOLY SHIT!!!'
    }
];

/**
 * Get a reward by its ID
 * @param {string} rewardId - The reward's unique identifier
 * @returns {Object|undefined} The reward object or undefined if not found
 */
export function getRewardById(rewardId) {
    return REWARDS.find(reward => reward.id === rewardId);
}

/**
 * Get all rewards sorted by cost (ascending)
 * @returns {Array} Array of reward objects
 */
export function getRewardsSortedByCost() {
    return [...REWARDS].sort((a, b) => a.cost - b.cost);
}

/**
 * Format reward notification message with user mention
 * @param {Object} reward - The reward object
 * @param {string} userMention - The user mention string (e.g., <@123456>)
 * @returns {string} Formatted notification message
 */
export function formatNotification(reward, userMention) {
    return reward.notification.replace('{user}', userMention);
}

export default REWARDS;
