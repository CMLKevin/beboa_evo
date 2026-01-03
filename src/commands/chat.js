/**
 * /chat command - Talk to Beboa
 * Allows users to have AI-powered conversations with the Beboa persona
 */

import { SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';
import {
    getUser,
    addChatMessage,
    getChatHistory,
    clearAllChatHistory
} from '../database.js';
import { isOpenRouterConfigured, chatCompletion } from '../services/openrouter.js';
import {
    BEBOA_SYSTEM_PROMPT,
    buildUserContext,
    getErrorMessage,
    getCooldownMessage,
    getDisabledMessage
} from '../utils/beboa-persona.js';

// Cooldown tracking
const cooldowns = new Map();

export const data = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Talk to Beboa, the bratty snake companion')
    .addStringOption(option =>
        option
            .setName('message')
            .setDescription('What do you want to say to Beboa?')
            .setRequired(true)
            .setMaxLength(2000)
    );

export async function execute(interaction) {
    const userId = interaction.user.id;
    const displayName = interaction.user.displayName || interaction.user.username;
    const userMessage = interaction.options.getString('message');

    // Check if feature is enabled
    if (!config.CHAT_ENABLED || !isOpenRouterConfigured()) {
        return await interaction.reply({
            content: getDisabledMessage(),
            ephemeral: true
        });
    }

    // Check cooldown
    const cooldownRemaining = checkCooldown(userId);
    if (cooldownRemaining > 0) {
        return await interaction.reply({
            content: getCooldownMessage(cooldownRemaining),
            ephemeral: true
        });
    }

    // Defer reply since API call might take a moment
    await interaction.deferReply();

    try {
        // Get user data for context
        const userData = getUser(userId);

        // Build the messages array with shared history
        const messages = buildMessageArray(displayName, userData, userMessage);

        // Call OpenRouter API
        const result = await chatCompletion(messages);

        if (!result.success) {
            console.error(`[CHAT] API call failed for ${interaction.user.tag}:`, result.error);
            return await interaction.editReply({
                content: getErrorMessage()
            });
        }

        // Store in persistent conversation history
        saveConversation(displayName, userMessage, result.content);

        // Set cooldown
        setCooldown(userId);

        // Log the interaction
        console.log(`[CHAT] ${interaction.user.tag}: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}" -> Response sent`);

        // Send response (public)
        await interaction.editReply({
            content: result.content
        });

    } catch (error) {
        console.error('[CHAT] Error:', error);
        await interaction.editReply({
            content: getErrorMessage()
        });
    }
}

/**
 * Build the messages array for the API call
 * Uses SHARED history from database so Beboa remembers all users across restarts
 */
function buildMessageArray(displayName, userData, currentMessage) {
    // Get shared conversation history from database (limited by CHAT_MAX_HISTORY)
    const maxHistory = (config.CHAT_MAX_HISTORY || 10) * 2; // *2 because each exchange is 2 messages
    const history = getChatHistory(maxHistory);

    // Build system prompt with current user context
    const userContext = buildUserContext(userData, displayName);
    const fullSystemPrompt = BEBOA_SYSTEM_PROMPT + '\n' + userContext;

    // Construct messages array
    const messages = [
        { role: 'system', content: fullSystemPrompt }
    ];

    // Add shared conversation history - each message tagged with who said it
    history.forEach(msg => {
        if (msg.role === 'user') {
            messages.push({ role: 'user', content: `[${msg.display_name}]: ${msg.content}` });
        } else {
            messages.push({ role: 'assistant', content: msg.content });
        }
    });

    // Add current message with user identification
    messages.push({ role: 'user', content: `[${displayName}]: ${currentMessage}` });

    return messages;
}

/**
 * Save conversation exchange to database
 * @param {string} displayName - User's display name
 * @param {string} userMessage - User's message
 * @param {string} assistantResponse - Beboa's response
 */
function saveConversation(displayName, userMessage, assistantResponse) {
    // Save user message
    addChatMessage(displayName, userMessage, 'user');

    // Save assistant response
    addChatMessage('Beboa', assistantResponse, 'assistant');
}

/**
 * Check if user is on cooldown
 * @param {string} userId - Discord user ID
 * @returns {number} Seconds remaining, or 0 if not on cooldown
 */
function checkCooldown(userId) {
    const lastTime = cooldowns.get(userId);
    if (!lastTime) return 0;

    const cooldownMs = (config.CHAT_COOLDOWN_SECONDS || 30) * 1000;
    const elapsed = Date.now() - lastTime;

    if (elapsed >= cooldownMs) {
        cooldowns.delete(userId);
        return 0;
    }

    return Math.ceil((cooldownMs - elapsed) / 1000);
}

/**
 * Set cooldown for a user
 * @param {string} userId - Discord user ID
 */
function setCooldown(userId) {
    cooldowns.set(userId, Date.now());
}

/**
 * Clear all conversation history
 */
export function clearHistory() {
    clearAllChatHistory();
}

/**
 * Get chat statistics (for admin/debugging)
 * @returns {Object} Statistics about chat usage
 */
export function getChatStats() {
    const history = getChatHistory(100);
    return {
        activeConversations: history.length > 0 ? 1 : 0,
        totalMessages: history.length,
        activeCooldowns: cooldowns.size
    };
}

export default { data, execute, clearHistory, getChatStats };
