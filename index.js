'use strict';
const discord = require('discord.js');
const dotenv = require('dotenv');
const stackexchange = require('stackexchange');
const giphy = require('giphy-js-sdk-core');
const { _prefix, _q, _filter } = require('./config.json');

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

var formatReply = function(data) {
  let combinedString = 'Here are some of the top results: \n\n';
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
const getGif = function(callback) {
  giphy_client
    .search('gifs', { q: _q })
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
const discord_client = new discord.Client();

discord_client.once('ready', () => {
  console.log('Ready!');
});

discord_client.on('message', message => {
  if (message.content.startsWith(`${discord.prefix}?`)) {
    message.channel.send(
      `Ask me everything about programming\nCommand: !s [language] [specific questions]`
    );
  } else if (message.content.startsWith(`${_prefix}`)) {
    let keywords = message.content.replace(_prefix, '');
    getStackOverflowData(keywords, results => {
      if (results.length > 0) {
        message.channel.send(formatReply(results));
      } else {
        getGif(gif => {
          message.channel.send('um... i think is time to go home.', {
            files: [gif]
          });
        });
      }
    });
  }
});

discord_client.login(process.env.DISCORD_TOKEN);
