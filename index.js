'use strict';
const discord = require('discord.js');
const dotenv = require('dotenv');
const stackexchange = require('stackexchange');
const giphy = require('giphy-js-sdk-core');
const { _prefix, _filter, _replies } = require('./config.json');

dotenv.config();

/************************
 *  Stack Exchange
 * ********************** */
const stack_client = new stackexchange({ version: 2.2 });
const filter = _filter;
filter.key = process.env.STACKEXCHANGE_KEY;

var getStackOverflowData = function(keyword, callback) {
  filter.q = keyword;
  filter.tagged = keyword.trim().split(' ')[0];
  filter.title = filter.tagged;

  stack_client.search.advanced(filter, (err, results) => {
    if (err) throw err;
    callback(results.items.filter(x => x.is_answered == true));
  });
};

var formatReply = function(data, userId) {
  let combinedString = `Dear my boss <@${userId}>, here are some of the best results for you:\n\n`;
  for (let i = 0; i < data.length; i++) {
    combinedString += `Q. ${data[i].title}\nTags: ${data[i].tags.join(
      ' | '
    )}\n${data[i].link}\n\n`;
  }
  return combinedString;
};

/************************
 *  Giphy
 * ********************** */
const giphy_client = giphy(process.env.GIPHY_KEY);
const getGif = function(tag, callback) {
  giphy_client
    .search('gifs', { q: tag })
    .then(response => {
      var totalResponses = response.data.length;
      var responseIndex = Math.floor(Math.random() * 10 + 1) % totalResponses;
      var responseFinal = response.data[responseIndex];

      callback(responseFinal.images.fixed_height.url);
    })
    .catch(err => {});
};

/************************
 *  Discord
 * ********************** */
const bot = new discord.Client();

bot.once('ready', () => {
  bot.user.setActivity('You', { type: 'WATCHING' });
});

bot.on('message', message => {
  const args = message.content.split(' ');
  if (args) {
    if (args[0] === `${_prefix}?`) {
      message.channel.send(
        `Ask me everything about programming!\nMy command is: !s [language] [specific questions]`
      );
    } else if (args[0] === `${_prefix}`) {
      const keywords = message.content.replace(_prefix, '');
      getStackOverflowData(keywords, results => {
        if (results.length > 0) {
          message.channel.send(formatReply(results, message.author.id));
        } else {
          const reply = _replies[Math.floor(Math.random() * _replies.length)];
          getGif(reply.giphy, gif => {
            message.channel.send(reply.message, {
              files: [gif]
            });
          });
        }
      });
    }
  }
});

bot.login(process.env.DISCORD_TOKEN);
