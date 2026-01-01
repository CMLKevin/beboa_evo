import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, getTopUsers, getUserRank } from '../database.js';
import { buildLeaderboardDescription, LEADERBOARD_FOOTER, databaseError } from '../utils/messages.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top users by Bebits');

export async function execute(interaction) {
    try {
        const userId = interaction.user.id;

        // Get user data for their rank
        const user = getUser(userId);

        // Get top 10 users
        const topUsers = getTopUsers(10);

        // Get user's rank
        const userRank = getUserRank(userId);

        // Build leaderboard description
        const description = buildLeaderboardDescription(
            topUsers,
            userRank,
            user.bebits,
            userId
        );

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('🐍 BEBOA\'S LEADERBOARD OF DEVOTION 🐍')
            .setDescription(description)
            .setColor(0x9B59B6) // Purple color
            .setFooter({ text: LEADERBOARD_FOOTER })
            .setTimestamp();

        // Reply public
        await interaction.reply({
            embeds: [embed],
            ephemeral: false
        });

    } catch (error) {
        console.error('[LEADERBOARD ERROR]', error);

        const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyMethod]({
            content: databaseError(),
            ephemeral: true
        });
    }
}

export default { data, execute };
