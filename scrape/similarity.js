import { pipeline } from '@xenova/transformers';

// Function to calculate semantic similarity using the model
async function calculateSimilarity(text1, text2, modelName) {
  try {
    // Load the feature-extraction pipeline with the specified model
    const extractor = await pipeline('feature-extraction', `Xenova/${modelName}`);
    
    // Add prefix to the texts as required by the models (matching Python implementation)
    const processedText1 = `passage: ${text1}`;
    const processedText2 = `passage: ${text2}`;
    
    // Extract embeddings for both texts
    const embedding1 = await extractor(processedText1, { pooling: 'mean', normalize: true });
    const embedding2 = await extractor(processedText2, { pooling: 'mean', normalize: true });
    
    // Convert to array for easier handling
    const array1 = Array.from(embedding1.data);
    const array2 = Array.from(embedding2.data);
    
    // Calculate dot product (cosine similarity since vectors are normalized)
    let similarity = 0;
    for (let i = 0; i < array1.length; i++) {
      similarity += array1[i] * array2[i];
    }
    
    return similarity;
  } catch (error) {
    console.error(`Error calculating similarity with ${modelName}:`, error);
    throw error;
  }
}

// Example usage with your specific inputs
async function main() {
  const input1 = "Apple iPhone ";
  const input2 = "mobile phones";
  
  console.log(`Input 1: ${input1}`);
  console.log(`Input 2: ${input2}`);
  
  // Test with all-mpnet-base-v2
  try {
    console.log("\nGenerating embeddings for all-mpnet-base-v2");
    const mpnetSimilarity = await calculateSimilarity(input1, input2, 'all-mpnet-base-v2');
    console.log(`Similarity (dot product): ${mpnetSimilarity.toFixed(4)}`);
  } catch (error) {
    console.error('Failed with all-mpnet-base-v2');
  }
  
  // Test with all-MiniLM-L6-v2
  try {
    console.log("\nGenerating embeddings for all-MiniLM-L6-v2");
    const miniL6Similarity = await calculateSimilarity(input1, input2, 'all-MiniLM-L6-v2');
    console.log(`Similarity (dot product): ${miniL6Similarity.toFixed(4)}`);
  } catch (error) {
    console.error('Failed with all-MiniLM-L6-v2');
  }
  
  // Test with all-MiniLM-L12-v2
  try {
    console.log("\nGenerating embeddings for all-MiniLM-L12-v2");
    const miniL12Similarity = await calculateSimilarity(input1, input2, 'all-MiniLM-L12-v2');
    console.log(`Similarity (dot product): ${miniL12Similarity.toFixed(4)}`);
  } catch (error) {
    console.error('Failed with all-MiniLM-L12-v2');
  }
}

main();