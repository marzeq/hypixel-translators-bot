import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"

const command: Command = {
    name: "claim",
    description: "Claims a custom voice channel when the owner has disconnected.",
    usage: "+claim",
    cooldown: 30,
    dev: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        if (!message.member!.voice.channel) throw "noVoice"
        const collection = db.collection("test_users"),
            ownerDb: DbUser | null = await collection.findOne({ "customChannel.id": message.member!.voice.channelID }),
            executedBy = getString("executedBy", { user: message.author.tag }, "global")
        if (message.author.id === ownerDb?.id) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("alreadyOwner"))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        }
        else if (ownerDb && message.member?.voice.channel.members.get(ownerDb.id)) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("ownerConnected"))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        } else {
            if (ownerDb) {
                collection.updateOne({ id: ownerDb.id }, { $unset: { "customChannel.id": true } })
                message.member!.voice.channel!.permissionOverwrites.get(ownerDb.id)?.delete("No longer owns this channel")
            }
            collection.updateOne({ id: message.author.id }, { $set: { "customChannel.id": message.member!.voice.channelID } })
            message.member!.voice.channel!.updateOverwrite(message.author.id, { MANAGE_CHANNELS: true, CONNECT: true })
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("claimSuccess"))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        }
    }
}

export default command
