// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');
const unfluff = require("unfluff");
const inquirer = require('inquirer');
const audioconcat = require('audioconcat');
var Typo = require("typo-js");
var dictionary = new Typo("en_US");

var questions = [{
  type: 'input',
  name: 'url',
  message: "URL: ",
},{
  type: 'input',
  name: 'name',
  message: "File Name: ",
}]

module.exports = main;

function main() {
let dirname = process.cwd()+"/";
inquirer.prompt(questions).then(answers => {
  let name = answers["name"];
  let url = answers["url"];
  fetch(url).then((raw) => {
    return raw.text();
  }).then(async (data) => {
    let text = unfluff(data);

    if (text.copyright != null) {
      console.log(`Copyright: ${text.copyright}`);
    }

    let wrng = text.text.split(" ");
    let correct = wrng;

    let prob = dictionary.suggest(wrng[0]);

    for (var i = 0; i < prob.length; i++) {
      if (prob[i].indexOf(wrng[0]) != -1) {
        correct = prob[i];
      }
    }

    wrng[0] = correct;

    text.text = wrng.join(" ");

    let final = `
      ${text.title} by ${text.author[1]} originally published on ${text.publisher}

      ${text.text}
    `;

    let clips = [];

    let chunks = chunkString(final,4999);
    for (var i = 0; i < chunks.length; i++) {
      // Creates a client
      const client = new textToSpeech.TextToSpeechClient();

      // Construct the request
      const request = {
        audioConfig: {
          audioEncoding: "LINEAR16",
          pitch: 0,
          speakingRate: 1
        },
        input: {text: chunks[i]},
        // Select the language and SSML Voice Gender (optional)
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        // Select the type of audio encoding
        audioConfig: {audioEncoding: 'MP3'},
      };

      // Performs the Text-to-Speech request
      const [response] = await client.synthesizeSpeech(request);
      // Write the binary audio content to a local file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(`${dirname+name+i}.mp3`, response.audioContent, 'binary');
      clips.push(`${dirname+name+i}.mp3`);
    }

    audioconcat(clips)
      .concat(dirname+name+'.mp3')
      .on('start', function (command) {
        return ;
      })
      .on('error', function (err, stdout, stderr) {
        console.error('Error:', err)
        console.error('ffmpeg stderr:', stderr)
      })
      .on('end', () => {
        console.log(`Your audio has been saved to ${name}.mp3`);
        for (var i = 0; i < clips.length; i++) {
          fs.unlinkSync(clips[i]);
        }
      })
  });
});
}

function chunkString(strToChunk, nSize) {
  nSize *= 0.9;
  let result = [];
  let chars = String(strToChunk).split('');

  for (let i = 0; i < (String(strToChunk).length / nSize); i++) {
      result = result.concat(chars.slice(i*nSize,(i+1)*nSize).join(''));
  }

  for (var i = 1; i < result.length; i++) {
    if (result[i].slice(0,1) !== " ") {
      let rss = result[i].split(" ");
      result[i-1] += rss[0];
      result[i] = rss.slice(1).join(" ");
    };
  }
  return result;
}
