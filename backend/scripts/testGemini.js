import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🧪 Testing Gemini API Key...\n');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables!');
  console.error('💡 Please add GEMINI_API_KEY to your .env file');
  process.exit(1);
}

console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`📝 API Key length: ${apiKey.length} characters\n`);

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try gemini-2.5-flash first, then fallback options
  const modelsToTry = [
    'gemini-2.5-flash',               // Latest flash model (recommended)
    'models/gemini-2.5-flash',        // Full path format
    'gemini-1.5-flash',               // Fallback to 1.5 flash
    'gemini-1.5-pro',                 // Fallback to 1.5 pro
    'gemini-pro',                     // Fallback to standard pro
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying model: ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        // Try to force v1 API if possible
      });
      
      const prompt = 'Say "Hello" in Vietnamese';
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Success with ${modelName}!`);
      console.log(`📝 Response: ${text}\n`);
      console.log(`💡 Use this model name in your code: ${modelName}`);
      console.log('🎉 Your Gemini API key is working correctly!');
      process.exit(0);
    } catch (modelError) {
      console.log(`❌ Failed with ${modelName}: ${modelError.message}`);
      
      if (modelError.message?.includes('API_KEY_INVALID') || 
          modelError.message?.includes('API key') ||
          modelError.message?.includes('401') ||
          modelError.message?.includes('403')) {
        console.error('\n❌ API Key is invalid or unauthorized!');
        console.error('💡 Please check:');
        console.error('   1. API key is correct (no extra spaces)');
        console.error('   2. API key is from https://aistudio.google.com/app/apikey');
        console.error('   3. Generative Language API is enabled in your Google Cloud project');
        console.error('   4. API key has proper permissions');
        process.exit(1);
      }
      
      if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
        // Model not found, continue to next
        continue;
      }
      
      // Continue to next model
      continue;
    }
  }
  
  console.error('\n❌ All models failed. Please check your API key and try again.');
  process.exit(1);
  
} catch (error) {
  console.error('\n❌ Error testing Gemini API:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  
  if (error.errorDetails) {
    console.error('Error Details:', JSON.stringify(error.errorDetails, null, 2));
  }
  
  process.exit(1);
}

