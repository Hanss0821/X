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
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { RetrievalQAChain } from "langchain/chains";

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
const qdrantStore = await createQdrantVectorStore(chunked_documents);
// 创建QA链
const chain = createQAChain(qdrantStore, qwenTurbo);
// 执行chat model
init();

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
  // 嵌入模型
  const vectorStore = await QdrantVectorStore.fromDocuments(
    chunksDocumnets,
    new AlibabaTongyiEmbeddings(),
    {
      url: process.env.QDRANT_URL as string,
      collectionName: "oneFlower",
    }
  );
  return vectorStore;
}

// 创建QA链
function createQAChain(
  vectorStore: QdrantVectorStore,
  qwenTurbo: ChatAlibabaTongyi
) {
  const retriever = vectorStore.asRetriever();
  const llm = qwenTurbo;
  const chain = RetrievalQAChain.fromLLM(llm, retriever);
  return chain;
}

async function chat(chain: RetrievalQAChain, question: string) {
  const response = await chain.call({ query: question });
  return response.text;
}

function init() {
  console.log("Hello!");
  process.stdin.on("data", (buffer) => {
    const question = buffer.toString().trim();
    if (question === "exit") {
      process.exit();
    }
    chat(chain, question).then((res) => {
      console.log(res);
    });
  });
}
