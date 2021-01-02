const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const hypixel = require('../../Hypixel');
const { methodAlias } = require('../../constants');
const { MessageAttachment } = require('discord.js');
class WrapperCommand extends Command {
  constructor () {
    super('wrapper', {
      aliases: ['w', 'wrapper'],
      description: 'Return programatically parsed results from the API',
      cooldown: 15000,
      ratelimit: 2,
      args: [
        {
          id: 'method',
          type: (message, phrase) => {
            return methodAlias[phrase.toLowerCase()];
          }
        },
        {
          id: 'args',
          match: 'text'
        },
        {
          id: 'noParse',
          match: 'flag',
          flag: '-raw'
        }
      ]
    });
  }

  /**
     *
     * @param {Message} message
     * @param {{method:string, args:string, noParse:boolean}} args
     */
  async exec (message, args) {
    if (!args.method) {
      const embed = new MessageEmbed()
        .setColor(this.client.color)
        .setDescription(`I need to know which method to call.\n\nList of methods:\n${Object.keys(methodAlias).map(ma => `${ma} => \`${methodAlias[ma]}\``).join('\n')}\n\nUsage: \`${this.handler.prefix}${this.id} player StavZDev\``);
      return message.channel.send(embed);
    }
    args.args = args.args.split(/ +/);
    if (args.args.length > 2 && args.method !== 'getGuild') return message.channel.send('Too many arguments. Only 1 is allowed, except for getGuild');
    args.args.shift();
    const result = await hypixel[args.method](...args.args).catch(e => {
      return message.channel.send(`Error occurred: \`${e}\``);
    });
    if (args.noParse) {
      const attachment = new MessageAttachment(Buffer.from(JSON.stringify(result, null, 4)), 'result.json');
      return message.channel.send('API Result : ', { files: [attachment] });
    }
    return message.channel.send(new MessageEmbed()
      .addFields(this.format(result))
      .addField('\u200B', 'More results might be hidden')
      .setColor(this.client.color)
      .setTitle(args.method)
      .setTimestamp()
    );
  }

  /**
     * Parses response from wrapper to an array of fields.
     * @param {any} result Response from wrapper
     */
  format (result) {
    if (Array.isArray(result)) return this.format(result[0]);
    if (typeof result === 'object') {
      const obj = Object.getOwnPropertyNames(result).reduce((a, b) => {
        if (Array.isArray(result[b])) a[b] = result[b].join(', ');
        else a[b] = typeof result[b] === 'object' ? JSON.stringify(result[b]) : result[b];
        return a;
      }, {});
      return Object.keys(obj).map(x => ({ name: x, value: obj[x].toString().length > 1024 ? obj[x].toString().slice(0, 1024) : obj[x].toString() })).slice(0, 24);
    }
    return [{ name: 'Response', value: String(result) }];
  }
}
module.exports = WrapperCommand;