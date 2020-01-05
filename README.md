# t2mp3

## Install
This will install t2mp3 globaly as a command line application

```
npm install t2mp3 -g .
```

## Usage

There are three different mode of t2mp3 (text, ssml, and url). Text and SSML modes will read a .txt or .ssml file respectively, and output a mp3 file in the current directory. URL mode will go to the website and parse just the main text from the article (like instapaper) and output a mp3 with that content. When using t2mp3 all you have to do is run t2mp3 in the terminal with what mode you want as a argument, like below.

```
t2mp3 url
```

Then is will prompt you for a URL or file name for the input file. Note that you do NOT need a file extention just type the file name! Then it will ask you for a output file name, also do NOT put an extention in the name.

and that's all!