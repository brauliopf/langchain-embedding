import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

// Get content from text file
async function loadContent(filePath){
  try {
    const result = await fetch(filePath)
    const text = await result.text()
    return text
  } catch (err) {
    console.log(err)
  }
}

// Split the text into chunks
async function splitText(text){
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
    separators: ['\n\n', '\n', ' ', ''], // default setting --in decreasng priority order
  });
  const chunks = await splitter.createDocuments([text]);
  return chunks;
}

// EXECUTION
async function main() {  

  // Add trigger to load content
  const loadButton = document.createElement("button");
  loadButton.innerHTML = "Load Text";
  document.querySelector("#menu").appendChild(loadButton); 
  // Load content
  const filePath = "./assets/resume.txt"; 
  loadButton.onclick = async (filePath) => {
    document.getElementById("output").innerHTML = await loadContent("./assets/resume.txt");
    splitButton.disabled = false;
    return true;
  };
  
  // Add trigger to split content
  const splitButton = document.createElement("button");
  splitButton.innerHTML = "Split Text";
  splitButton.disabled = true;
  document.querySelector("#menu").appendChild(splitButton);
  output = []
  // Split content
  splitButton.onclick = async () => {
    const content = document.getElementById("output").innerHTML;
    output = await splitText(content);
    console.log(output, typeof output)
    document.getElementById("chunks").innerHTML = output.map((chunk) => chunk.pageContent).join('<br><br>');
    storeButton.disabled = false;
  };

  // Add trigger to store chunks in Supabase
  const storeButton = document.createElement("button");
  storeButton.innerHTML = "Store Chunks";
  storeButton.disabled = true;
  document.querySelector("#menu").appendChild(storeButton);
  // Store in Supabase
  storeButton.onclick = async () => {
    const openAIApiKey = process.env.OPENAI_API_KEY
    try {
      // Get Supabase Client. Supabase/LangChain Docs: https://supabase.com/docs/guides/ai/langchain
      const sbApiKey = process.env.SUPABASE_API_KEY
      const sbUrl = process.env.SUPABASE_URL
      const sbClient = createClient(sbUrl, sbApiKey);
      // Store chunks with embeddings
      await SupabaseVectorStore.fromDocuments(
        output,
        new OpenAIEmbeddings({ openAIApiKey }),
        {
           client: sbClient,
           tableName: 'documents',
        }
      )
    } catch(err) {
      console.log(err)
    }
  }

}

main();