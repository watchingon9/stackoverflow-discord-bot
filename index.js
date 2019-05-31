const Discord = require('discord.js');
const dotenv = require('dotenv');
const StackExchange = require('stackexchange');
const GphApiClient = require('giphy-js-sdk-core');
const { discord, stackexchange, giphy } = require('./config.json');

dotenv.config();

const discord_client = new Discord.Client();
const giphy_client = GphApiClient(process.env.GIPHY_KEY);
const stack_client = new StackExchange({ version: 2.2 });
const filter = stackexchange.filter;
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

var getGif = function(callback) {
  giphy_client
    .search('gifs', { q: giphy.key })
    .then(response => {
      var totalResponses = response.data.length;
      var responseIndex = Math.floor(Math.random() * 10 + 1) % totalResponses;
      var responseFinal = response.data[responseIndex];

      callback(responseFinal.images.fixed_height.url);
    })
    .catch(err => {});
};

discord_client.once('ready', () => {
  console.log('Ready!');
});

discord_client.on('message', message => {
  if (message.content.startsWith(`${discord.prefix}?`)) {
    message.channel.send(
      `Ask me everything about programming\nCommand: !s [language] [specific questions]`
    );
  } else if (message.content.startsWith(`${discord.prefix}`)) {
    let keywords = message.content.replace(discord.prefix, '');
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
