import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import path from "path";
const __dirname = path.resolve();
dotenv.config({path:path.resolve(__dirname,'./.env.local')});
console.log('start');
const model = new ChatOpenAI({ model: "gpt-4" });
const messages = [
    new SystemMessage("Translate the following from English into Italian"),
    new HumanMessage("hi!"),
  ];
  
const res = await model.invoke(messages);
console.log(res);