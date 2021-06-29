module.exports = {

endpoints: {
 command: (bot_id) => `https://discord.com/api/v8/applications/${bot_id}`,
 callback: (id , token , botID) => `/interactions/${id}/${token}/callback`,
 messages: (id , token , botID) => `/webhooks/${botID}/${token}/messages/@original`,
 followup: (id , token , botID) => `/webhooks/${botID}/${token}`,
 edit: (id , token , botID) => `/webhooks/${botID}/${token}/messages/${id}`
},

types: {
SUB_COMMAND: 1,
SUB_COMMAND_GROUP: 2,
STRING: 3,
INTEGER: 4,
BOOLEAN: 5,
USER:6,
CHANNEL:7,
ROLE:8
}



}