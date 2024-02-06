const express = require('express');
const {Telegraf} = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express(); 
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const port = process.env.PORT || 3000;  




// Converts local file information to a GoogleGenerativeAI.Part object.
async function fileToGenerativePart(path, mimeType) {
    const response = await fetch(path);
    const fileBuffer = await response.arrayBuffer(); 
    return {
      inlineData: {
        data: Buffer.from(fileBuffer).toString('base64'),
        mimeType
      },
    };
  }

async function rungemini(prompt , model , imagePath = null){
  const genAImodel = genAI.getGenerativeModel({ model: model });
  if(model === "gemini-pro"){
    const result = await genAImodel.generateContent(prompt);
    const message = await result.response.text();
    return message;
  }else {
    const part = await fileToGenerativePart(imagePath, "image/jpeg");
    const result = await genAImodel.generateContent([prompt, part]);
    const response = await result.response;
    const text = response.text();
    return text;
  }

}


bot.start((ctx) => ctx.reply('Welcome!'));
bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    ctx.replyWithChatAction("typing");
    const response = await rungemini(message , "gemini-pro");
    ctx.reply(response);
})

bot.on('photo', async (ctx) => {
    const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    ctx.replyWithChatAction("typing");
    const prompt = ctx.message.caption;
    const file = await ctx.telegram.getFileLink(photo);
    const response = await rungemini(prompt, "gemini-pro-vision",file.href );
    ctx.reply(response);
});

bot.catch((err, ctx) => {
    ctx.reply(err.message);
});

bot.launch();


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening at ${port}`);
});


