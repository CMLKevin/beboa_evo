import { SlashCommandBuilder } from 'discord.js';
import { getUser } from '../database.js';
import { balanceDisplay, databaseError } from '../utils/messages.js';

export const data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your Bebits balance and streak');

export async function execute(interaction) {
    try {
        const userId = interaction.user.id;

        // Get or create user
        const user = getUser(userId);

        // Build response
        const response = balanceDisplay(
            user.bebits,
            user.current_streak,
            user.total_checkins
        );

        // Reply ephemeral
        await interaction.reply({
            content: response,
            ephemeral: true
        });

    } catch (error) {
        console.error('[BALANCE ERROR]', error);

        const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyMethod]({
            content: databaseError(),
            ephemeral: true
        });
    }
}

export default { data, execute };
