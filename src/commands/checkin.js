import { SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';
import { getUser, updateUser } from '../database.js';
import { canCheckin, getCurrentTimestamp } from '../utils/time.js';
import {
    checkinSuccess,
    checkinRecovered,
    checkinReset,
    checkinCooldown,
    checkinFirst,
    wrongChannel,
    databaseError
} from '../utils/messages.js';

export const data = new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Daily check-in to earn 1 Bebit');

export async function execute(interaction) {
    try {
        // Check if command is used in the correct channel
        if (interaction.channelId !== config.CHECKIN_CHANNEL_ID) {
            return await interaction.reply({
                content: wrongChannel(config.CHECKIN_CHANNEL_ID),
                ephemeral: true
            });
        }

        const userId = interaction.user.id;
        const username = interaction.user.displayName || interaction.user.username;

        // Get or create user
        const user = getUser(userId);

        // Check if user can check in
        const checkinStatus = canCheckin(user.last_checkin);

        // User is on cooldown
        if (!checkinStatus.canCheckin) {
            return await interaction.reply({
                content: checkinCooldown(
                    username,
                    user.bebits,
                    user.current_streak,
                    checkinStatus.hours,
                    checkinStatus.minutes
                ),
                ephemeral: true
            });
        }

        // Process check-in based on status
        const now = getCurrentTimestamp();
        let responseMessage;
        let newBebits;
        let newStreak;

        switch (checkinStatus.reason) {
            case 'first':
                // First time check-in
                newBebits = 1;
                newStreak = 1;
                responseMessage = checkinFirst(username, newBebits);
                break;

            case 'continue':
                // Normal streak continuation (24-48 hours)
                newBebits = user.bebits + 1;
                newStreak = user.current_streak + 1;
                responseMessage = checkinSuccess(username, newBebits, newStreak);
                break;

            case 'recovered':
                // Streak recovered within grace period (48-72 hours)
                newBebits = user.bebits + 1;
                newStreak = user.current_streak + 1;
                responseMessage = checkinRecovered(username, newBebits, newStreak);
                break;

            case 'reset':
                // Streak reset (> 72 hours)
                const oldStreak = user.current_streak;
                newBebits = user.bebits + 1;
                newStreak = 1;
                responseMessage = checkinReset(username, newBebits, oldStreak);
                break;

            default:
                throw new Error(`Unknown checkin status: ${checkinStatus.reason}`);
        }

        // Update user in database
        updateUser(userId, {
            bebits: newBebits,
            current_streak: newStreak,
            last_checkin: now,
            total_checkins: user.total_checkins + 1
        });

        console.log(`[CHECKIN] ${username} (${userId}): +1 Bebit, streak=${newStreak}, total=${newBebits}`);

        // Send public response
        await interaction.reply({
            content: responseMessage,
            ephemeral: false
        });

    } catch (error) {
        console.error('[CHECKIN ERROR]', error);

        // Reply with error message
        const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyMethod]({
            content: databaseError(),
            ephemeral: true
        });
    }
}

export default { data, execute };
