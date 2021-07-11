const events = require("events");
const config = require("../config");
const axios = require("axios")

axios.defaults.headers.common['user-agent'] = "DiscordBot (slashCommands, 0.0.1)";

module.exports = class extends events {
    constructor(data, id, token) {
        super();
        if (typeof data !== "object") throw new Error("command data must me an object")
        if (typeof id !== "string") throw new Error("client id must me an string")
        if (typeof token !== "string") throw new Error("client token must me an string")

        this.token = token
        this._token = token.split(" ")[1]
        this.id = id

        this.options = data.options ? (Array.isArray(data.options) ? data.options : []) : [];

        this.name = data.name || undefined
        this.description = data.description || undefined
        this.guild_id = data.guild_id || undefined
    }

    setName(name) {
        if (!name) throw new Error("name is not defined")
        if (typeof name !== "string") throw new Error("name must me an string")
        this.name = name
        return this
    }

    setDescription(description) {
        if (!description) throw new Error("description is not defined")
        if (typeof description !== "string") throw new Error("description must me an string")
        this.description = description
        return this
    }

    addOption(name, description, required = false, choices = [], type = 3) {
        if (this.options.find(o => o.name === name)) {
            this.options = this.options.filter(o => o.name !== name)
        }

        if (!name) throw new Error("name is not defined")
        if (typeof name !== "string") throw new Error("name must me an string")

        this.options.push({
            name: name.toLowerCase(),
            description: description,
            required: required,
            type: type,
            choices: choices
        })

        return this
    }

    removeOption(name) {
        if (!this.options.find(o => o.name === name)) throw new Error(`${name} is not a option`)
        this.options = this.options.filter(o => o.name !== name)
    }

    url(guild_id) {
        let endpoint = config.endpoints.command(this.id)
        return guild_id ? endpoint + "/guilds/" + guild_id + "/commands" : endpoint + "/commands"
    }


    save(guild_id = this.guild_id) {
        return new Promise((re, rej) => {
            let url = this.url(guild_id)
            axios.post(url, {
                name: this.name.toLowerCase(),
                description: this.description,
                options: this.options
            }, {
                headers: {
                    authorization: this.token
                }
            }).then(res => {
                re(res.data)
            }).catch(err => {
                let response = err.response
                rej(response.data)
            })

        })
    }

    async fetchCommands(guildID) {
        if (!this.ready) throw new Error("The bot is not ready");
        return await new Promise((re, rej) => {
            let url;

            if (guildID) {
                url = config.endpoints.command(this.id) + "/guilds/" + guildID + "/commands"
            } else {
                url = config.endpoints.command(this.id) + "/commands"
            }

            axios.get(url, {
                headers: {
                    authorization: this._client._token
                }
            }).then(res => {
                if (!res) return;
                re(res.data)
            }).catch(err => {
                rej(err.response)
            })

        })
    }

    async delete(guildID) {
        let commands = await this.fetchCommands(guildID);

        let command = commands.find(c => c.id === this.commandID || c.name === this.name)
        if (!command) throw new Error("There is no command with this name or id")

        return new Promise((re, rej) => {
            axios.delete(guildID ? config.endpoints.command(this.id) + "/guilds" + guildID + "/commands/" + command.id : config.endpoints.command(this.id) + "/commands/" + command.id, {
                    headers: {
                        authorization: this._client._token
                    }
                })
                .then((res) => {
                    if (!res) return;
                    re(command)
                }).catch(err => {
                    rej(err.response.data)
                })

        })
    }




}
