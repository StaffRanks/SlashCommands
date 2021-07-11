const events = require("events");
const config = require("../config");

const Command = require("./command.js");
const Interaction = require("./interaction.js")

const axios = require("axios")
axios.defaults.headers.common['user-agent'] = "DiscordBot (slashCommands, 0.0.1)";

module.exports = class extends events {
    constructor(client, config) {
        super();
        this._client = client
        this.id = null
        client.slash = this

        this._start();
        this._eventhandler();
    }

    get ready() {
        return this._client.ready
    }

    _eventhandler() {
        this._client.on("ready", () => {
            this.id = this._client.user.id
        })
        this._client.on("rawWS", (packet, shardID) => {
            if (packet.t === "INTERACTION_CREATE") {
                const data = packet.d;
                const interaction = new Interaction(this._client, data);
                this._client.emit("interactionCreate", interaction)
            }
        })
    }


    async _start() {
        if (!this._client.ready) {
            await new Promise((re) => {
                this._client.once("ready", () => re())
            })


        }

        this.id = this._client.user.id
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

    async delete(nameorid, guildID) {
        let commands = await this.fetchCommands(guildID);
        let command = commands.find(c => c.id === nameorid || c.name === nameorid)
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

    command(data = {}) {

        if (typeof data === "string") {
            let name = data
            data = {
                name
            }
        }

        if (!this.ready) throw new Error("The bot is not ready");
        return new Command(data, this.id, this._client._token)
    }

}
