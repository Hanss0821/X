import path from "path";
import * as dotenv from "dotenv";

import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
const __dirname = path.resolve();
dotenv.config({path:path.resolve(__dirname,'./.env.local')});
　　　　　　　　　
// Default model is qwen-turbo
// const qwenTurbo = new ChatAlibabaTongyi({
//   alibabaApiKey: process.env.ALIBABA_API_KEY, // In Node.js defaults to process.env.ALIBABA_API_KEY
// });

const qwenTurbo = new ChatAlibabaTongyi({
  model: "qwen-turbo", // Available models: qwen-turbo, qwen-plus, qwen-max
  temperature: 1,
  alibabaApiKey: process.env.ALIBABA_API_KEY, // In Node.js defaults to process.env.ALIBABA_API_KEY
});

export default qwenTurbo; // 导出模型
/*
AIMessage {
  content: "Hello! How can I help you today? Is there something you would like to talk about or ask about? I'm here to assist you with any questions you may have.",
}
*/

// const res2 = await qwenPlus.invoke(messages);
/*
AIMessage {
  text: "Hello! How can I help you today? Is there something you would like to talk about or ask about? I'm here to assist you with any questions you may have.",
}
*/
// console.log('res2',res2);