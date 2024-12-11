/**
 * 易速鲜花demo
 */
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import qwenTurbo from "./index.ts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import QdrantClient from "qdrant-client";
import axios from "axios";

type documentType = PDFLoader | DocxLoader | TextLoader;
type fileType = (typeof documents)[number];

const __dirname = path.resolve();
dotenv.config({ path: path.resolve(__dirname, "./.env.local") });

// 获取文件列表
const files = await getFiles();
// 使用loader解析非结构化文件
const documents = await loadFiles(files);
// 分割文本
const chunked_documents = await splitText(documents);
await createQdrantVectorStore(chunked_documents);
console.log(chunked_documents);

function getFiles(): Promise<string[]> {
  const dirPath = path.resolve(__dirname, "./public/oneFlower");
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
        console.error("读取目录失败");
        return;
      }
      // 拼接完整路径
      const filePaths = files.map((file) => path.join(dirPath, file));
      resolve(filePaths);
    });
  });
}
// 使用loader解析非结构化文件
async function loadFiles(files: string[]) {
  const documents = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // 获取文件后缀名
    const extname = path.extname(file);
    let loader: documentType | null = null;
    switch (extname) {
      case ".pdf":
        loader = new PDFLoader(file);
        break;
      case ".docx":
        loader = new DocxLoader(file);
        break;
      case ".txt":
        loader = new TextLoader(file);
        break;
      default:
        console.log("暂不支持该类型文件");
        break;
    }
    if (loader) {
      const document = await loader.load();
      // load加载返回的是一个数组
      documents.push(...document);
    }
  }
  return documents;
}
// 分割文本
async function splitText(documents: fileType[]) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200, // 切割成200个字符块的文档
    chunkOverlap: 10,
  });
  return textSplitter.splitDocuments(documents);
}

// 创建向量数据库
async function createQdrantVectorStore(chunksDocumnets: fileType[]) {
  for (let i = 0; i < chunksDocumnets.length; i++) {
    const chunk = chunksDocumnets[i];
    const vectorData = await getVectorText(chunk.pageContent);
    console.log(vectorData);
  }
}

// 获取向量文本
function getVectorText(text: string) {
  return new Promise((reslove, reject) => {
    axios
      .post(
        process.env.ALIBABA_API_EMBEDDING as string,
        {
          model: "text-embedding-v2",
          input: {
            texts: [text],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.ALIBABA_API_KEY,
          },
        }
      )
      .then((res) => {
        reslove(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
