const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY; // from .env
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

async function run() {
  const dummyPdfPath = path.join(__dirname, 'dummy.txt');
  fs.writeFileSync(dummyPdfPath, 'Hello this is a test text file we will pretend is an image/pdf to test multimodal upload');
  
  try {
    console.log("Uploading file...");
    const uploadResponse = await fileManager.uploadFile(dummyPdfPath, {
      mimeType: 'text/plain',
      displayName: 'Dummy File',
    });
    
    console.log("Uploaded successfully. URI:", uploadResponse.file.uri);
    
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    console.log("Asking Gemini 3.5 Flash Lite to read the uploaded file...");
    
    const request = model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        }
      },
      { text: "What does this file say?" },
    ]);
    
    const result = await request;
    console.log("Response:", result.response.text());
    
    console.log("Deleting file...");
    await fileManager.deleteFile(uploadResponse.file.name);
    console.log("Test completely successful!");

  } catch (e) {
    console.error("Test failed:", e.message);
  } finally {
    fs.unlinkSync(dummyPdfPath);
  }
}

run();
