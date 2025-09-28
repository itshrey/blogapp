import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to get the model
const getModel = () => {
  return genAI.getGenerativeModel({
    model: 'models/gemini-2.0-flash' // Updated to supported Gemini 2.0 Flash model
  });
};

// Improve blog content
export const improveBlog = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Blog content is required.' });
  }

  try {
    const model = getModel();

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please improve the grammar, structure, and flow of the following blog content and provide at least 50 words:\n\n${content}`
            }
          ]
        }
      ]
    });

    const improvedText = result.response.text();

    res.status(200).json({
      success: true,
      improvedText
    });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gemini processing failed.',
      error: err.message
    });
  }
};

// Generate engaging blog title
export const generateTitle = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Blog content is required.' });
  }

  try {
    const model = getModel();

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate a short and engaging blog title for this content:\n\n${content}`
            }
          ]
        }
      ]
    });

    const title = result.response.text();

    res.status(200).json({
      success: true,
      title: title.trim()
    });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gemini title generation failed.',
      error: err.message
    });
  }
};

// Summarize blog content
export const summarizeBlog = async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: "No content provided for summarization."
    });
  }

  try {
    const model = getModel();

    const prompt = `
      Summarize the following blog content in 2-3 concise sentences for readers:
      "${content}"
    `;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ]
    });

    const summary = result.response.text();

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      success: false,
      message: "Gemini summarization failed.",
      error: error.message
    });
  }
};
