// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');
const fetch = require('node-fetch');
const inquirer = require('inquirer');
const audioconcat = require('audioconcat');

var questions = [{
  type: 'input',
  name: 'url',
  message: "Input File (.ssml): ",
},{
  type: 'input',
  name: 'name',
  message: "Output File Name: ",
}]

module.exports = main;

function main() {
let dirname = process.cwd()+"/";
inquirer.prompt(questions).then(async answers => {
  let input = answers["url"];
  let output = answers["name"];

  let text = fs.readFileSync(dirname+input+".ssml").toString();

  let final = `
      ${input} originally written for Internet Public Radio

      ${text}
  `;

  let clips = [];

  let chunks = chunkString(text,4900);
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
      input: {ssml: `<speak>${chunks[i]}</speak>`},
      // Select the language and SSML Voice Gender (optional)
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      // Select the type of audio encoding
      audioConfig: {audioEncoding: 'MP3'},
    };

    // Performs the Text-to-Speech request
    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`${dirname+output+i}.mp3`, response.audioContent, 'binary');
    clips.push(`${dirname+output+i}.mp3`);
  }

  audioconcat(clips)
    .concat(dirname+output+'.mp3')
    .on('start', function (command) {
      return ;
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
    })
    .on('end', () => {
      console.log(`Your audio has been saved to ${output}.mp3`);
      for (var i = 0; i < clips.length; i++) {
        fs.unlinkSync(clips[i]);
      }
    })
});
}

function chunkString(strToChunk, nSize) {
  let result = [""];
  let chunks = strToChunk.split("</s>");
  let index = 0;
  for (var i = 0; i < chunks.length; i++) {
    if (result[index].length + chunks[i].length < nSize) {
      result[index] += chunks[i] + "</s>";
    } else {
      index++;
      result[index] = chunks[i] + "</s>";
    }
  }
  result[result.length-1] = result[result.length-1].slice(0,-4);
  return result;
}
