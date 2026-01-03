/**
 * /summarize command - Summarize recent messages in the channel
 * Supports both message count and time-based fetching
 */

import { SlashCommandBuilder } from 'discord.js';
import { isOpenRouterConfigured, chatCompletion } from '../services/openrouter.js';

const DEFAULT_MESSAGE_COUNT = 30;
const MAX_MESSAGE_COUNT = 100;
const MIN_MESSAGE_COUNT = 5;

/**
 * Parse a time string like "2h", "30m", "1d" into milliseconds
 * @param {string} timeStr - Time string (e.g., "2h", "30m", "1d", "1w")
 * @returns {number|null} Milliseconds or null if invalid
 */
function parseTimeString(timeStr) {
    if (!timeStr) return null;

    const match = timeStr.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|weeks?)$/);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2];

    const multipliers = {
        'm': 60 * 1000,
        'min': 60 * 1000,
        'mins': 60 * 1000,
        'minute': 60 * 1000,
        'minutes': 60 * 1000,
        'h': 60 * 60 * 1000,
        'hr': 60 * 60 * 1000,
        'hrs': 60 * 60 * 1000,
        'hour': 60 * 60 * 1000,
        'hours': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000,
        'days': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'weeks': 7 * 24 * 60 * 60 * 1000,
    };

    const multiplier = multipliers[unit];
    if (!multiplier) return null;

    return value * multiplier;
}

/**
 * Format milliseconds as a human-readable duration
 * @param {number} ms - Milliseconds
 * @returns {string} Human-readable duration
 */
function formatDuration(ms) {
    const minutes = Math.floor(ms / (60 * 1000));
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export const data = new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('Summarize recent messages in this channel')
    .addIntegerOption(option =>
        option
            .setName('messages')
            .setDescription(`Number of messages to summarize (default: ${DEFAULT_MESSAGE_COUNT}, max: ${MAX_MESSAGE_COUNT})`)
            .setRequired(false)
            .setMinValue(MIN_MESSAGE_COUNT)
            .setMaxValue(MAX_MESSAGE_COUNT)
    )
    .addStringOption(option =>
        option
            .setName('since')
            .setDescription('Time period to summarize (e.g., "2h", "30m", "1d", "1w")')
            .setRequired(false)
    );

export async function execute(interaction) {
    // Check if OpenRouter is configured
    if (!isOpenRouterConfigured()) {
        await interaction.reply({
            content: '🐍 Hisss... AI features are not configured. Ask an admin to set up the OpenRouter API key~',
            ephemeral: true
        });
        return;
    }

    // Get options
    const messageCount = interaction.options.getInteger('messages');
    const sinceStr = interaction.options.getString('since');

    // Parse the time string if provided
    let sinceMs = null;
    if (sinceStr) {
        sinceMs = parseTimeString(sinceStr);
        if (sinceMs === null) {
            await interaction.reply({
                content: '🐍 Hisss... I don\'t understand that time format! Use something like `2h`, `30m`, `1d`, or `1w`~',
                ephemeral: true
            });
            return;
        }
        // Cap at 7 days to avoid fetching too many messages
        const maxMs = 7 * 24 * 60 * 60 * 1000;
        if (sinceMs > maxMs) {
            await interaction.reply({
                content: '🐍 Hmph! I can only look back up to 7 days. Don\'t be greedy~',
                ephemeral: true
            });
            return;
        }
    }

    // Defer reply since fetching and summarizing may take a while
    await interaction.deferReply();

    try {
        let messages;
        let fetchDescription;

        if (sinceMs) {
            // Time-based fetch: fetch messages in batches until we go past the time limit
            const cutoffTime = Date.now() - sinceMs;
            const allMessages = [];
            let lastMessageId = null;
            let reachedCutoff = false;

            // Fetch in batches of 100 until we hit the time limit or run out of messages
            while (!reachedCutoff && allMessages.length < 500) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const batch = await interaction.channel.messages.fetch(options);
                if (batch.size === 0) break;

                for (const msg of batch.values()) {
                    if (msg.createdTimestamp < cutoffTime) {
                        reachedCutoff = true;
                        break;
                    }
                    allMessages.push(msg);
                    lastMessageId = msg.id;
                }
            }

            messages = new Map(allMessages.map(m => [m.id, m]));
            fetchDescription = `from the last ${formatDuration(sinceMs)}`;
        } else {
            // Count-based fetch
            const count = messageCount || DEFAULT_MESSAGE_COUNT;
            messages = await interaction.channel.messages.fetch({ limit: count });
            fetchDescription = `last ${messages.size} messages`;
        }

        // Filter out bot commands and empty messages, then format
        const filteredMessages = [...messages.values()]
            .filter(msg => !msg.content.startsWith('/') && msg.content.trim().length > 0)
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp); // Chronological order

        if (filteredMessages.length === 0) {
            await interaction.editReply({
                content: '🐍 Hmph! There are no messages to summarize here... Try a channel with actual conversations~'
            });
            return;
        }

        // Format messages for the AI
        const formattedMessages = filteredMessages
            .map(msg => {
                const timestamp = msg.createdAt.toLocaleString();
                const author = msg.author.displayName || msg.author.username;
                return `[${timestamp}] ${author}: ${msg.content}`;
            })
            .join('\n');

        // Build the summarization prompt
        const systemPrompt = `You are a helpful assistant that summarizes Discord chat conversations.
Your summaries should be:
- Concise but comprehensive
- Organized by topic if multiple topics were discussed
- Highlight key points, decisions, or important information
- Note any questions that were asked but not answered
- Keep a neutral tone

Format the summary with clear sections if needed. Use Discord markdown formatting (bold, bullet points, etc.) for readability.`;

        const userPrompt = `Please summarize the following ${filteredMessages.length} messages from this Discord channel:\n\n${formattedMessages}`;

        // Call OpenRouter for summarization
        const response = await chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], {
            temperature: 0.3, // Lower temperature for more focused summaries
            maxTokens: 1500
        });

        if (!response.success) {
            console.error('[SUMMARIZE] AI request failed:', response.error);
            await interaction.editReply({
                content: '🐍 Hisss... I couldn\'t summarize the messages right now. Try again later~'
            });
            return;
        }

        // Build the reply
        const summary = response.content;
        const header = `📜 **Summary of ${filteredMessages.length} messages (${fetchDescription}):**\n\n`;

        // Discord has a 2000 character limit, so we may need to truncate
        let reply = header + summary;
        if (reply.length > 2000) {
            reply = reply.substring(0, 1990) + '...\n*(truncated)*';
        }

        await interaction.editReply({ content: reply });

    } catch (error) {
        console.error('[SUMMARIZE] Error:', error);
        await interaction.editReply({
            content: '🐍 Hisss... Something went wrong while summarizing. Please try again~'
        });
    }
}

export default { data, execute };
