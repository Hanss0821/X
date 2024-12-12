// 自定义 MultiQueryRetriever
export class MultiQueryRetriever {
    constructor({ llm, retriever, numQueries = 3 }) {
      this.llm = llm;
      this.retriever = retriever;
      this.numQueries = numQueries;
    }
  
    async getRelevantDocuments(question) {
      // 1. 生成查询变体
      const prompt = `Generate ${this.numQueries} different ways to ask the following question:\n"${question}"`;
      const { text: queriesText } = await this.llm.call({ prompt });
      const queries = queriesText.split("\n").filter((q) => q.trim() !== "");
  
      // 2. 执行检索
      const allDocs = [];
      for (const query of queries) {
        const docs = await this.retriever.getRelevantDocuments(query);
        allDocs.push(...docs);
      }
  
      // 3. 去重合并
      const uniqueDocs = Array.from(
        new Map(allDocs.map((doc) => [doc.pageContent, doc])).values()
      );
  
      return uniqueDocs;
    }
  }