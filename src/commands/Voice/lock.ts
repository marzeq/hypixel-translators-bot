import Discord from "discord.js"
import { successColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"

const command: Command = {
    name: "lock",
    description: "Locks the current custom voice channel",
    aliases: ["unlock"],
    usage: "+lock",
    cooldown: 5,
    dev: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        if (!message.member!.voice.channel) throw "noVoice"
        const collection = db.collection("test_users"),
            ownerDb: DbUser | null = await collection.findOne({ "customChannel.id": message.member!.voice.channelID }),
            locked = !message.member!.voice.channel.permissionsFor(message.guild!.id)!.toArray().includes("CONNECT"),
            executedBy = getString("executedBy", { user: message.author.tag }, "global")
        if (message.author.id !== ownerDb?.id) throw "noOwner"
        else {
            if (!locked) {
                message.member!.voice.channel!.updateOverwrite(message.guild!.id, { CONNECT: false })
                    .then(() => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("lockSuccess"))
                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                        return message.channel.send(embed)
                    })
                    .catch(console.error)
            } else {
                message.member!.voice.channel!.updateOverwrite(message.guild!.id, { CONNECT: true })
                    .then(() => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("unlockSuccess"))
                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                        return message.channel.send(embed)
                    })
                    .catch(console.error)
            }
        }
    }
}

export default command
