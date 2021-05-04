import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"

const command: Command = {
    name: "permit",
    description: "Allows a user or role into your voice channel",
    aliases: ["allow"],
    usage: "+permit <user or role>",
    cooldown: 5,
    dev: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        if (!message.member!.voice.channel) throw "noVoice"
        const collection = db.collection("test_users"),
            ownerDb: DbUser | null = await collection.findOne({ "customChannel.id": message.member!.voice.channelID }),
            executedBy = getString("executedBy", { user: message.author.tag }, "global")
        if (message.author.id !== ownerDb?.id) throw "noOwner"
        else {
            args[0] = args[0].replace(/[\\<>@&!]/g, "")
            const userOrRole = message.guild!.roles.cache.get(args[0]) || message.guild!.members.cache.get(args[0])
            if (!userOrRole) {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("noUserOrRole"))
                    .setDescription(getString("errorDescription"))
                    .setFooter(executedBy, message.author.displayAvatarURL())
                return message.channel.send(embed)
            }
            message.member!.voice.channel.updateOverwrite(userOrRole, { CONNECT: true, VIEW_CHANNEL: true })
                .then(() => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("success", { userOrRole: userOrRole instanceof Discord.Role ? userOrRole.name : userOrRole.user.tag }))
                })
        }
    }
}

export default command
