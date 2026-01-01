import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { config } from '../config.js';
import { getUser, processRedemption } from '../database.js';
import { getRewardById } from '../utils/rewards.js';
import {
    confirmRedemption,
    redemptionSuccess,
    redemptionCancelled,
    buildRedemptionNotification,
    insufficientBebits,
    databaseError,
    interactionExpired
} from '../utils/messages.js';

// Track in-progress redemptions to prevent double-clicks
const processingUsers = new Set();

/**
 * Handle button interactions
 * @param {ButtonInteraction} interaction - The button interaction
 */
export async function handleButton(interaction) {
    const customId = interaction.customId;

    try {
        // Route to appropriate handler based on button type
        if (customId.startsWith('reward_')) {
            await handleRewardSelection(interaction);
        } else if (customId.startsWith('confirm_')) {
            await handleConfirmation(interaction);
        } else if (customId === 'cancel') {
            await handleCancel(interaction);
        } else {
            console.warn(`[BUTTONS] Unknown button: ${customId}`);
        }
    } catch (error) {
        console.error('[BUTTONS] Error handling button:', error);

        try {
            const content = databaseError();
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content, ephemeral: true });
            } else {
                await interaction.reply({ content, ephemeral: true });
            }
        } catch (replyError) {
            console.error('[BUTTONS] Failed to send error response:', replyError);
        }
    }
}

/**
 * Handle reward selection button click
 * Shows confirmation dialog
 */
async function handleRewardSelection(interaction) {
    const rewardId = interaction.customId.replace('reward_', '');
    const reward = getRewardById(rewardId);

    if (!reward) {
        return await interaction.reply({
            content: '🐍 Hisss... this reward no longer exists~',
            ephemeral: true
        });
    }

    // Get fresh user data
    const user = getUser(interaction.user.id);

    // Verify user can still afford it
    if (user.bebits < reward.cost) {
        return await interaction.reply({
            content: insufficientBebits(reward.cost, user.bebits),
            ephemeral: true
        });
    }

    const remainingBalance = user.bebits - reward.cost;

    // Build confirmation embed
    const embed = new EmbedBuilder()
        .setTitle(`${reward.emoji} Confirm Redemption`)
        .setDescription(confirmRedemption(reward.name, reward.cost, remainingBalance))
        .setColor(0xF39C12) // Warning orange
        .setTimestamp();

    // Build confirmation buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_${rewardId}`)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

    // Update the original message with confirmation
    await interaction.update({
        embeds: [embed],
        components: [row]
    });
}

/**
 * Handle confirmation button click
 * Processes the redemption
 */
async function handleConfirmation(interaction) {
    const userId = interaction.user.id;
    const rewardId = interaction.customId.replace('confirm_', '');
    const reward = getRewardById(rewardId);

    if (!reward) {
        return await interaction.update({
            content: '🐍 Hisss... this reward no longer exists~',
            embeds: [],
            components: []
        });
    }

    // Prevent double-clicks
    if (processingUsers.has(userId)) {
        return await interaction.reply({
            content: '🐍 Patience! Beboa is already processing your request...',
            ephemeral: true
        });
    }

    processingUsers.add(userId);

    try {
        // Process the redemption atomically
        const result = processRedemption(userId, reward.id, reward.name, reward.cost);

        if (!result.success) {
            processingUsers.delete(userId);
            return await interaction.update({
                content: insufficientBebits(reward.cost, result.balance),
                embeds: [],
                components: []
            });
        }

        // Send notification to command center
        await sendRedemptionNotification(
            interaction.client,
            reward,
            interaction.user,
            result.newBalance
        );

        console.log(`[REDEMPTION] ${interaction.user.tag} redeemed ${reward.name} for ${reward.cost} bebits`);

        // Update original message with success
        const successEmbed = new EmbedBuilder()
            .setTitle('🐍 Redemption Complete!')
            .setDescription(redemptionSuccess(reward.name, reward.cost, result.newBalance))
            .setColor(0x2ECC71) // Success green
            .setTimestamp();

        await interaction.update({
            embeds: [successEmbed],
            components: []
        });

    } finally {
        processingUsers.delete(userId);
    }
}

/**
 * Handle cancel button click
 */
async function handleCancel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🐍 Redemption Cancelled')
        .setDescription(redemptionCancelled())
        .setColor(0x95A5A6) // Gray
        .setTimestamp();

    await interaction.update({
        embeds: [embed],
        components: []
    });
}

/**
 * Send redemption notification to the command center channel
 */
async function sendRedemptionNotification(client, reward, user, remainingBalance) {
    try {
        const channel = await client.channels.fetch(config.NOTIFICATION_CHANNEL_ID);

        if (!channel) {
            console.error('[NOTIFICATIONS] Could not find notification channel');
            return;
        }

        const notificationContent = buildRedemptionNotification(
            reward,
            `<@${user.id}>`,
            user.tag,
            remainingBalance,
            config.ADMIN_ROLE_ID
        );

        await channel.send({
            content: notificationContent,
            allowedMentions: {
                roles: [config.ADMIN_ROLE_ID],
                users: [user.id]
            }
        });

        console.log(`[NOTIFICATIONS] Sent redemption notification for ${user.tag}`);

    } catch (error) {
        console.error('[NOTIFICATIONS] Failed to send notification:', error);
    }
}

export default { handleButton };
