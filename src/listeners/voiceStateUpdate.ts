import Discord from "discord.js"
import { client } from "../index"
import { db, DbUser } from "../lib/dbclient"

client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.guild.id === "549503328472530974") {
        const logs = client.channels.cache.get("591280178873892901") as Discord.TextChannel,
            collection = db.collection("test_users"),
            successColor = "43B581",
            errorColor = "FF470F",
            joinChannel = "827560440573591582",
            joinCategory = "827558483284328478"
        if (newState.channelID === joinChannel) { // If the user wants to create a custom channel
            const userDb: DbUser = await collection.findOne({ id: newState.id })
            const overwrites: Discord.OverwriteResolvable[] = [{
                id: newState.id,
                allow: ["MANAGE_CHANNELS", "CONNECT"]
            },
            {
                id: "569194996964786178", // Verified
                allow: "VIEW_CHANNEL"
            }]
            if (userDb.customChannel?.overwrites?.allow) userDb.customChannel.overwrites.allow.forEach(id => overwrites.push({ id: id, allow: "CONNECT" }))
            if (userDb.customChannel?.overwrites?.deny) userDb.customChannel.overwrites.deny.forEach(id => overwrites.push({ id: id, deny: "CONNECT" }))
            if (userDb.customChannel?.settings?.locked) overwrites.push({ id: newState.guild.id, deny: "CONNECT" })
            const customChannel = await newState.guild.channels.create(userDb.customChannel?.settings?.name || `${newState.member!.displayName}'s channel`, {
                type: "voice",
                permissionOverwrites: overwrites,
                position: newState.channel!.parent!.children.size,
                userLimit: userDb.customChannel?.settings?.limit,
                parent: joinCategory
            })
            customChannel.setPosition(newState.channel!.parent!.children.size - 1) //Dumb fix for options.position being unreliable, has no visual impact on the user
            collection.updateOne({ id: newState.id }, { $set: { "customChannel.id": customChannel.id } })
            newState.setChannel(customChannel, "Created a custom channel")
        }
        if (oldState.channel?.parentID === joinCategory && !oldState.channel.members.size && oldState.channelID !== joinChannel) { // If the user leaves a custom channel and leaves it empty
            const locked = oldState.channel.permissionOverwrites.get(oldState.guild.id)?.deny.toArray().includes("CONNECT")
            const allow = oldState.channel.permissionOverwrites.filter(overwrite => overwrite.allow?.toArray().includes("CONNECT")).map(overwrite => overwrite.id)
            const deny = oldState.channel.permissionOverwrites.filter(overwrite => overwrite.deny?.toArray().includes("CONNECT")).map(overwrite => overwrite.id)
            await collection.updateOne({ "customChannel.id": oldState.channelID }, { $set: { "customChannel.settings.name": oldState.channel.name, "customChannel.settings.limit": oldState.channel.userLimit, "customChannel.settings.locked": locked, "customChannel.overwrites.allow": allow, "customChannel.overwrites.deny": deny }, $unset: { "customChannel.id": true } }) //Store all the info for the deleted channel
            oldState.channel.delete("All users left")
        }
        
        // Give users access to #no-mic
        if (!oldState.channel && newState.channel) newState.member!.roles.add("829312419406020608", "Joined a voice channel") // In Voice
        else if (oldState.channel && !newState.channel) newState.member!.roles.remove("829312419406020608", "Left a voice channel")

        if (!!oldState.serverMute != !!newState.serverMute) { // Convert to falsey value to prevent null != false from triggering the condition
            const embed = new Discord.MessageEmbed()
                .setColor(newState.serverMute ? errorColor : successColor)
                .setAuthor(newState.member!.user.tag, newState.member!.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setDescription(`**${newState.member} was server ${newState.serverMute ? "muted" : "unmuted"} in ${newState.channel?.name}**`)
                .setFooter(`ID: ${newState.member!.id}`)
                .setTimestamp(Date.now())
            logs.send(embed)
        } else if (!!oldState.serverDeaf != !!newState.serverDeaf) {
            const embed = new Discord.MessageEmbed()
                .setColor(newState.serverDeaf ? errorColor : successColor)
                .setAuthor(newState.member!.user.tag, newState.member!.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setDescription(`**${newState.member} was server ${newState.serverDeaf ? "deafened" : "undeafened"} in ${newState.channel?.name}**`)
                .setFooter(`ID: ${newState.member!.id}`)
                .setTimestamp(Date.now())
            logs.send(embed)
        }
    }
})