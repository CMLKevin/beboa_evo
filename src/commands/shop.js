import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import { getUser } from '../database.js';
import { REWARDS } from '../utils/rewards.js';
import { buildShopDescription, databaseError } from '../utils/messages.js';

export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View available rewards and redeem');

export async function execute(interaction) {
    try {
        const userId = interaction.user.id;

        // Get user data
        const user = getUser(userId);

        // Build shop embed
        const embed = new EmbedBuilder()
            .setTitle('🐍 BEBOA\'S REWARD EMPORIUM 🐍')
            .setDescription(buildShopDescription(user.bebits))
            .setColor(0xE74C3C) // Red color
            .setTimestamp();

        // Build action rows with buttons (max 5 buttons per row)
        const actionRows = [];
        let currentRow = new ActionRowBuilder();

        REWARDS.forEach((reward, index) => {
            // Check if user can afford this reward
            const canAfford = user.bebits >= reward.cost;

            const button = new ButtonBuilder()
                .setCustomId(`reward_${reward.id}`)
                .setLabel(`${reward.emoji} ${reward.cost}`)
                .setStyle(canAfford ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(!canAfford);

            currentRow.addComponents(button);

            // Start new row after 5 buttons
            if ((index + 1) % 5 === 0) {
                actionRows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        });

        // Add remaining buttons if any
        if (currentRow.components.length > 0) {
            actionRows.push(currentRow);
        }

        // Reply ephemeral with embed and buttons
        await interaction.reply({
            embeds: [embed],
            components: actionRows,
            ephemeral: true
        });

    } catch (error) {
        console.error('[SHOP ERROR]', error);

        const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
        await interaction[replyMethod]({
            content: databaseError(),
            ephemeral: true
        });
    }
}

export default { data, execute };
