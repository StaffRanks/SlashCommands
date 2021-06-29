const events = require("events");
const config = require("../config");
const Eris = require("eris")

module.exports = class extends events {
constructor(client , data) {
super();
this.sent = false

this._client = client
this.packet = data

this.applicationID = data.application_id
this.id = data.id
this.token = data.token
this.guildID = data.guild_id
this.channelID = data.channel_id

this.name = data.data.name
this.commandID = data.data.id

this.memberData = data.member
this.resolved = data.data.resolved || {}

this.optionsData = data.data.options || []
this.messages = []
this.options = {}

this.users = Object.values(this.resolved.users || {}).map(data => new Eris.User(data , this._client))

this.roles = Object.values(this.resolved.roles || {}).map(data => {
let guild = this._client.guilds.find(guild => guild.roles.get(data.id))
return guild ? guild.roles.get(data.id) : data
})
this.channels = Object.values(this.resolved.channels || {}).map(data => {
let channel = this._client.getChannel(data.id)
return channel || data
})

this.members = Object.keys(this.resolved.members || {}).map(key => {
let data = Object.assign(this.resolved.members[key] , { id: key, user: this.resolved.users[key] })

let guild = this._client.guilds.find(guild => guild.id == this.guildID)

if(guild) {
let member = guild.members.get(data.id) || new Eris.Member(data , guild , this._client)
return member
}else{
return data
}

})

this.optionsData.forEach(d => {
if(d.type === 1) { this.options[d.name] = d.value}
if(d.type === 2) { this.options[d.name] = d.value}
if(d.type === 3) { this.options[d.name] = d.value}
if(d.type === 4) { this.options[d.name] = d.value}
if(d.type === 5) { this.options[d.name] = d.value}
if(d.type === 6) { this.options[d.name] = this.members.find(a => a.id === d.value) }
if(d.type === 7) { this.options[d.name] = this.channels.find(a => a.id === d.value)}
if(d.type === 8) { this.options[d.name] = this.roles.find(a => a.id === d.value) }
if(d.type === 9) { this.options[d.name] = d.value}

})

this._check();
}

url(type = "callback") {
let func = config.endpoints[type]
let url = func(this.id , this.token , this.applicationID)
return url
}

_check() {
this.guild = this._client.guilds.get(this.guildID) || { id: this.guildID }
this.channel = this._client.getChannel(this.channelID) || { id: this.channelID }

if(this.guild.name){
let member = this.guild.members.get(this.memberData.id)

if(!member){
let mm = new Eris.Member(this.memberData, this.guild, this._client)
this.member = mm
}else{
this.member = member
}
}else{
this.member = this.memberData
}

if(this.member.user) { this.author = this.member.user } else { this.author = null }
}


reply(content , file , type=4) {

        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && !file) {
                return Promise.reject(new Error("No content, file, or embed"));
            }
        } else if(!file) {
            return Promise.reject(new Error("No content, file, or embed"));
        }

let url = this.sent ? this.url("followup") : this.url()
return this._client.requestHandler.request("POST", url, true, this.sent ? content : {type: type, data: content}, file).then(res =>{
this.sent = true

let msg;

if(res) {
let message = new Eris.Message(res , this._client)
msg = message
this.messages.push(message)
}

return msg
})
}

edit(content , file) {
let msgID;
if(typeof content === "object") { 
msgID = content.msgID
} 
        if(content !== undefined) {
            if(typeof content !== "object" || content === null) {
                content = {
                    content: "" + content
                };
            } else if(content.content !== undefined && typeof content.content !== "string") {
                content.content = "" + content.content;
            } else if(content.content === undefined && !content.embed && !file) {
                return Promise.reject(new Error("No content, file, or embed"));
            }
        } else if(!file) {
            return Promise.reject(new Error("No content, file, or embed"));
        }
if(!msgID){
return this._client.requestHandler.request("PATCH", this.url("messages"), true,content, file)
}else{
// this.url("messages") // id , token , botID
let url = config.endpoints.edit(msgID, this.token, this.applicationID)
return this._client.requestHandler.request("PATCH", url, true,content, file)
}

}

delete(msgID) {
if(msgID){
return this._client.requestHandler.request("DELETE", this.url("messages"), true)
} else {
let url = config.endpoints.edit(msgID, this.token, this.applicationID)
return this._client.requestHandler.request("DELETE", url, true)
}
}





}